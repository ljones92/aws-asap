import { Command, flags } from '@oclif/command';
import cli from 'cli-ux';
import * as inquirer from 'inquirer';
import { SecretsManager } from 'aws-sdk';

export default class SearchSM extends Command {
    static description = 'search parameters in AWS Secrets Manager';

    static examples = [
        `$ asap sm -t awesome-param
awesome param value
`,
    ];

    static flags = {
        help: flags.help({ char: 'h' }),
        term: flags.string({ exclusive: ['all'], char: 't', description: 'term to search' }),
        region: flags.string({ char: 'r', description: 'AWS region override' }),
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

    searchResults: { name: string | undefined }[] = [];

    async getSearchResults(searchTerm: string | undefined, sm: SecretsManager, nextToken?: string): Promise<void> {
        const { flags } = this.parse(SearchSM);

        const searchParams: SecretsManager.ListSecretsRequest = {
            NextToken: nextToken,
            MaxResults: flags['max-results'] ?? 50,
        };

        const matches = await sm.listSecrets(searchParams).promise();

        let filteredList = matches.SecretList ?? [];
        if (!flags.all && searchTerm) {
            filteredList = filteredList.filter((item) => item.Name?.includes(searchTerm));
        }

        const parameters = filteredList.map((parameter) => ({ name: parameter.Name })) ?? [];

        this.searchResults.push(...parameters);

        if (matches.NextToken && (flags['no-limit'] || flags.all)) {
            await this.getSearchResults(searchTerm, sm, matches.NextToken);
        }
    }

    async promptForSecrets(): Promise<{ secrets: string[] }> {
        return inquirer.prompt([
            {
                name: 'secrets',
                message: 'Select your secrets',
                type: 'checkbox',
                choices: this.searchResults,
            },
        ]);
    }

    async run(): Promise<void> {
        const { flags } = this.parse(SearchSM);

        const sm = new SecretsManager({ region: flags.region ?? process.env.AWS_REGION ?? 'us-east-1' });

        if (!sm.config.credentials?.sessionToken && process.env.NODE_ENV !== 'test') {
            this.error('Please authenticate against AWS to use this tool');
        }

        let searchTerm: string | undefined;

        if (!flags.all) {
            searchTerm =
                flags.term ??
                ((await cli.prompt('What term do you want to search for?', { type: 'normal' })) as string);
        }

        cli.action.start('listing matching parameters');
        await this.getSearchResults(searchTerm, sm);
        cli.action.stop();

        if (this.searchResults && this.searchResults.length > 0) {
            let chosenSecrets = await this.promptForSecrets();

            while (chosenSecrets.secrets.length === 0) {
                this.log('No secrets selected');

                chosenSecrets = await this.promptForSecrets();
            }

            const secretRequestPromises: Promise<SecretsManager.GetSecretValueResponse>[] = chosenSecrets.secrets.map(
                (item: string) => {
                    const getParams: SecretsManager.GetSecretValueRequest = {
                        SecretId: item,
                    };

                    return sm.getSecretValue(getParams).promise();
                },
            );

            cli.action.start('retrieving secrets');
            const result = await Promise.all(secretRequestPromises);
            cli.action.stop();

            if (result && result.length > 0) {
                this.log('\n');
                cli.table(
                    result,
                    {
                        Name: {},
                        SecretString: { header: 'Value' },
                        SecretBinary: { extended: true },
                        ARN: { extended: true },
                        VersionId: { extended: true },
                        CreatedDate: { extended: true },
                    },
                    { ...flags },
                );

                return;
            }
        }

        this.warn('No Secrets found');
        this.exit(1);
    }
}
