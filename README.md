# AWS ASAP - The AWS Secrets and Parameters Searching Tool

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/aws-asap.svg)](https://npmjs.org/package/aws-asap)
[![Downloads/week](https://img.shields.io/npm/dw/aws-asap.svg)](https://npmjs.org/package/aws-asap)
[![License](https://img.shields.io/npm/l/aws-asap.svg)](https://github.com/ljones92/mit/blob/master/package.json)

<!-- toc -->
* [AWS ASAP - The AWS Secrets and Parameters Searching Tool](#aws-asap---the-aws-secrets-and-parameters-searching-tool)
* [Requirements](#requirements)
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->

# Requirements

You will need to have an active AWS session in your current shell against the target account in order to retrieve Secrets and Parameters.

The following permissions are required for each of the resources you're attempting to retrieve:

* ps
  * ssm:DescribeParameters
  * ssm:GetParameters
  * kms:Decrypt (if using SecureString type with own CMK rather than AWS-managed)

* sm
  * secretsmanager:ListSecrets
  * secretsmanager:GetSecretValue
  * kms:Decrypt (if using own CMK rather than AWS-managed)

# Usage

<!-- usage -->
```sh-session
$ npm install -g aws-asap
$ asap COMMAND
running command...
$ asap (-v|--version|version)
aws-asap/0.2.1 darwin-x64 node-v12.18.2
$ asap --help [COMMAND]
USAGE
  $ asap COMMAND
...
```
<!-- usagestop -->

# Commands

<!-- commands -->
* [`asap autocomplete [SHELL]`](#asap-autocomplete-shell)
* [`asap help [COMMAND]`](#asap-help-command)
* [`asap ps`](#asap-ps)
* [`asap sm`](#asap-sm)

## `asap autocomplete [SHELL]`

display autocomplete installation instructions

```
USAGE
  $ asap autocomplete [SHELL]

ARGUMENTS
  SHELL  shell type

OPTIONS
  -r, --refresh-cache  Refresh cache (ignores displaying instructions)

EXAMPLES
  $ asap autocomplete
  $ asap autocomplete bash
  $ asap autocomplete zsh
  $ asap autocomplete --refresh-cache
```

_See code: [@oclif/plugin-autocomplete](https://github.com/oclif/plugin-autocomplete/blob/v0.2.0/src/commands/autocomplete/index.ts)_

## `asap help [COMMAND]`

display help for asap

```
USAGE
  $ asap help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all  see all commands in CLI
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v3.1.0/src/commands/help.ts)_

## `asap ps`

search parameters in AWS SSM Parameter Store

```
USAGE
  $ asap ps

OPTIONS
  -d, --disable-decryption       disable decryption of SecureString type params by default
  -h, --help                     show CLI help
  -n, --max-results=max-results  limit for amount of results returned, default is 50
  -r, --region=region            AWS region override
  -t, --term=term                term to search
  -x, --extended                 show extra columns
  --all                          retrieve every parameter in the region
  --csv                          output is csv format
  --no-header                    hide table header from output
  --no-limit                     retrieve every parameter for the search term
  --no-truncate                  do not truncate output to fit screen

EXAMPLE
  $ asap ps -t awesome-param
```

_See code: [src/commands/ps.ts](https://github.com/ljones92/aws-asap/blob/v0.2.1/src/commands/ps.ts)_

## `asap sm`

search parameters in AWS Secrets Manager

```
USAGE
  $ asap sm

OPTIONS
  -h, --help                     show CLI help
  -n, --max-results=max-results  limit for amount of results returned, default is 50
  -r, --region=region            AWS region override
  -t, --term=term                term to search
  -x, --extended                 show extra columns
  --all                          retrieve every parameter in the region
  --csv                          output is csv format
  --no-header                    hide table header from output
  --no-limit                     retrieve every parameter for the search term
  --no-truncate                  do not truncate output to fit screen

EXAMPLE
  $ asap sm -t awesome-param
  awesome param value
```

_See code: [src/commands/sm.ts](https://github.com/ljones92/aws-asap/blob/v0.2.1/src/commands/sm.ts)_
<!-- commandsstop -->
