/* eslint-disable @typescript-eslint/ban-types */
import { expect, test } from '@oclif/test';
import cli from 'cli-ux';
import * as AWSMock from 'aws-sdk-mock';
import * as AWS from 'aws-sdk';
import { ListSecretsRequest, GetSecretValueRequest } from 'aws-sdk/clients/secretsmanager';
import { stub } from 'sinon';
import SearchSM from '../../src/commands/sm';

describe('sm', () => {
    const promptStub = stub(SearchSM.prototype, 'promptForSecrets');
    promptStub.returns(Promise.resolve({ secrets: ['1'] }));

    afterEach(() => {
        AWSMock.restore();
    });

    context('parameters found', () => {
        beforeEach(() => {
            AWSMock.setSDKInstance(AWS);

            AWSMock.mock('SecretsManager', 'listSecrets', (params: ListSecretsRequest, callback: Function) => {
                callback(null, Promise.resolve({ SecretList: [{ Name: 'test' }] }));
            });

            AWSMock.mock('SecretsManager', 'getSecretValue', (params: GetSecretValueRequest, callback: Function) => {
                callback(null, Promise.resolve({ Name: 'test', SecretString: 'hello', ARN: 'testARN' }));
            });
        });

        test.stub(cli, 'prompt', () => () => 'tes')
            .stdout()
            .command(['sm'])
            .it('gets secret', (ctx) => {
                expect(ctx.stdout).to.contain('test hello');
            });

        test.stdout()
            .command(['sm', '--term=te'])
            .it('gets secret when term flag passed', (ctx) => {
                expect(ctx.stdout).to.contain('test hello');
            });

        test.stdout()
            .command(['sm', '--all'])
            .it('does not show ARN by default', (ctx) => {
                expect(ctx.stdout).to.not.contain('testARN');
            });

        test.stub(cli, 'prompt', () => () => 'test')
            .stdout()
            .command(['sm', '-x'])
            .it('does show ARN when extended flag passed', (ctx) => {
                expect(ctx.stdout).to.contain('testARN');
            });
    });

    context('no parameters found', () => {
        beforeEach(() => {
            AWSMock.setSDKInstance(AWS);

            AWSMock.mock('SecretsManager', 'listSecrets', (params: ListSecretsRequest, callback: Function) => {
                callback(null, Promise.resolve({ SecretList: [] }));
            });

            AWSMock.mock('SecretsManager', 'getSecretValue', (params: GetSecretValueRequest, callback: Function) => {
                callback(null, Promise.resolve({}));
            });
        });

        test.stub(cli, 'prompt', () => () => 'Y')
            .stderr()
            .command(['sm'])
            .exit(1)
            .it('displays message that no secrets could be found', (ctx) => {
                expect(ctx.stderr).to.contain('No Secrets found');
            });
    });
});
