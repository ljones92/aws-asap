/* eslint-disable @typescript-eslint/ban-types */
import { expect, test } from '@oclif/test';
import cli from 'cli-ux';
import * as AWSMock from 'aws-sdk-mock';
import * as AWS from 'aws-sdk';
import { DescribeParametersRequest, GetParametersRequest } from 'aws-sdk/clients/ssm';
import { stub } from 'sinon';
import SearchPS from '../../src/commands/ps';

describe('ps', () => {
    const promptStub = stub(SearchPS.prototype, 'promptForParameters');
    promptStub.returns(Promise.resolve({ parameters: ['1'] }));

    afterEach(() => {
        AWSMock.restore();
    });

    context('parameters found', () => {
        beforeEach(() => {
            AWSMock.setSDKInstance(AWS);

            AWSMock.mock('SSM', 'describeParameters', (params: DescribeParametersRequest, callback: Function) => {
                callback(null, Promise.resolve({ Parameters: [{ Name: 'test' }] }));
            });

            AWSMock.mock('SSM', 'getParameters', (params: GetParametersRequest, callback: Function) => {
                callback(null, Promise.resolve({ Parameters: [{ Name: 'test', Value: 'hello', ARN: 'testARN' }] }));
            });
        });

        test.stub(cli, 'prompt', () => () => 'Y')
            .stdout()
            .command(['ps'])
            .it('gets parameter', (ctx) => {
                expect(ctx.stdout).to.contain('test hello');
            });

        test.stdout()
            .command(['ps', '--term=Y'])
            .it('gets parameter when term flag passed', (ctx) => {
                expect(ctx.stdout).to.contain('test hello');
            });

        test.stub(cli, 'prompt', () => () => 'Y')
            .stdout()
            .command(['ps'])
            .it('does not show ARN by default', (ctx) => {
                expect(ctx.stdout).to.not.contain('testARN');
            });

        test.stub(cli, 'prompt', () => () => 'Y')
            .stdout()
            .command(['ps', '-x'])
            .it('does show ARN when extended flag passed', (ctx) => {
                expect(ctx.stdout).to.contain('testARN');
            });
    });

    context('no parameters found', () => {
        beforeEach(() => {
            AWSMock.setSDKInstance(AWS);

            AWSMock.mock('SSM', 'describeParameters', (params: DescribeParametersRequest, callback: Function) => {
                callback(null, Promise.resolve({ Parameters: [] }));
            });

            AWSMock.mock('SSM', 'getParameters', (params: GetParametersRequest, callback: Function) => {
                callback(null, Promise.resolve({ Parameters: [] }));
            });
        });

        test.stub(cli, 'prompt', () => () => 'Y')
            .stderr()
            .command(['ps'])
            .exit(1)
            .it('displays message that no parameters could be found', (ctx) => {
                expect(ctx.stderr).to.contain('No Parameters found');
            });
    });
});
