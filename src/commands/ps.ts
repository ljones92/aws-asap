import { Command, flags } from '@oclif/command';
import cli from 'cli-ux';
import * as inquirer from 'inquirer';
import { SSM } from 'aws-sdk';

export default class SearchPS extends Command {
    static description = 'search parameters in AWS SSM Parameter Store';

    static examples = [`$ asap ps -t awesome-param`];

    static flags = {
        help: flags.help({ char: 'h' }),
        term: flags.string({ exclusive: ['all'], char: 't', description: 'term to search' }),
        region: flags.string({ char: 'r', description: 'AWS region override' }),
        'disable-decryption': flags.boolean({
            char: 'd',
            description: 'disable decryption of SecureString type params by default',
        }),
        'max-results': flags.integer({
            exclusive: ['no-limit', 'all'],
            char: 'n',
            description: 'limit for amount of results returned, default is 50',
        }),
        'no-limit': flags.boolean({
            exclusive: ['max-results', 'all'],
            description: 'retrieve every parameter for the search term',
        }),
        all: flags.boolean({
            exclusive: ['max-results', 'no-limit', 'term'],
            description: 'retrieve every parameter in the region',
        }),
        csv: flags.boolean({ exclusive: ['no-truncate'], description: 'output is csv format' }),
        extended: flags.boolean({ char: 'x', description: 'show extra columns' }),
        'no-truncate': flags.boolean({ exclusive: ['csv'], description: 'do not truncate output to fit screen' }),
        'no-header': flags.boolean({ exclusive: ['csv'], description: 'hide table header from output' }),
    };

    searchResults: { name: String | undefined }[] = [];

    async getSearchResults(searchTerm: string | undefined, ssm: SSM, nextToken?: string) {
        const { flags } = this.parse(SearchPS);

        const searchParams: SSM.DescribeParametersRequest = {
            NextToken: nextToken,
            MaxResults: flags['max-results'] ?? 50,
        };

        if (!flags.all && searchTerm) {
            searchParams.ParameterFilters = [
                {
                    Key: 'Name',
                    Option: 'Contains',
                    Values: [searchTerm],
                },
            ];
        }

        const matches = await ssm.describeParameters(searchParams).promise();
        const parameters = matches.Parameters?.map((parameter) => ({ name: parameter.Name })) ?? [];

        this.searchResults.push(...parameters);

        if (matches.NextToken && (flags['no-limit'] || flags.all)) {
            await this.getSearchResults(searchTerm, ssm, matches.NextToken);
        }
    }

    async promptForParameters() {
        return inquirer.prompt([
            {
                name: 'parameters',
                message: 'Select your parameters',
                type: 'checkbox',
                choices: this.searchResults,
            },
        ]);
    }

    async run() {
        const { flags } = this.parse(SearchPS);

        const ssm = new SSM({ region: flags.region ?? process.env.AWS_REGION ?? 'us-east-1' });

        if (!ssm.config.credentials?.sessionToken) {
            this.error('Please authenticate against AWS to use this tool');
        }

        let searchTerm;

        if (!flags.all) {
            searchTerm = flags.term ?? (await cli.prompt('What term do you want to search for?', { type: 'normal' }));
        }

        cli.action.start('listing matching parameters');
        await this.getSearchResults(searchTerm, ssm);
        cli.action.stop();

        if (this.searchResults && this.searchResults.length > 0) {
            let chosenParameters = await this.promptForParameters();

            while (chosenParameters.parameters.length === 0) {
                this.log('No parameters selected');

                chosenParameters = await this.promptForParameters();
            }

            const getParams: SSM.GetParametersRequest = {
                Names: chosenParameters.parameters,
                WithDecryption: !flags['disable-decryption'],
            };

            cli.action.start('retrieving parameters');
            const result = await ssm.getParameters(getParams).promise();
            cli.action.stop();

            if (result.Parameters) {
                this.log('\n');
                cli.table(
                    result.Parameters,
                    {
                        Name: {},
                        Value: {},
                        ARN: { extended: true },
                        Type: { extended: true },
                        Version: { extended: true },
                        LastModifiedDate: { extended: true },
                    },
                    { ...flags },
                );

                this.exit(0);
            }
        }

        this.log('No Parameters found');
        this.exit(1);
    }
}
