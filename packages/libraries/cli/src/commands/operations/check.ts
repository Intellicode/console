import { buildSchema, GraphQLError, Source } from 'graphql';
import { InvalidDocument, validate } from '@graphql-inspector/core';
import { Args, Errors, Flags } from '@oclif/core';
import Command from '../../base-command';
import { graphql } from '../../gql';
import { graphqlEndpoint } from '../../helpers/config';
import { ACCESS_TOKEN_MISSING } from '../../helpers/errors';
import { loadOperations } from '../../helpers/operations';
import { Texture } from '../../helpers/texture/texture';

const fetchLatestVersionQuery = graphql(/* GraphQL */ `
  query fetchLatestVersion {
    latestValidVersion {
      sdl
    }
  }
`);

export default class OperationsCheck extends Command<typeof OperationsCheck> {
  static description = 'checks operations against a published schema';
  static flags = {
    'registry.endpoint': Flags.string({
      description: 'registry endpoint',
    }),
    /** @deprecated */
    registry: Flags.string({
      description: 'registry address',
      deprecated: {
        message: 'use --registry.endpoint instead',
        version: '0.21.0',
      },
    }),
    'registry.accessToken': Flags.string({
      description: 'registry access token',
    }),
    /** @deprecated */
    token: Flags.string({
      description: 'api token',
      deprecated: {
        message: 'use --registry.accessToken instead',
        version: '0.21.0',
      },
    }),
    require: Flags.string({
      description: 'Loads specific require.extensions before running the command',
      default: [],
      multiple: true,
    }),
    graphqlTag: Flags.string({
      description: [
        'Identify template literals containing GraphQL queries in JavaScript/TypeScript code. Supports multiple values.',
        'Examples:',
        '  --graphqlTag graphql-tag (Equivalent to: import gqlTagFunction from "graphql-tag")',
        '  --graphqlTag graphql:react-relay (Equivalent to: import { graphql } from "react-relay")',
      ].join('\n'),
      multiple: true,
    }),
    globalGraphqlTag: Flags.string({
      description: [
        'Allows to use a global identifier instead of a module import. Similar to --graphqlTag.',
        'Examples:',
        '  --globalGraphqlTag gql (Supports: export const meQuery = gql`{ me { id } }`)',
        '  --globalGraphqlTag graphql (Supports: export const meQuery = graphql`{ me { id } }`)',
      ].join('\n'),
      multiple: true,
    }),
    apolloClient: Flags.boolean({
      description: 'Supports Apollo Client specific directives',
      default: false,
    }),
  };

  static args = {
    file: Args.string({
      name: 'file',
      required: true,
      description: 'Glob pattern to find the operations',
      hidden: false,
    }),
  };

  async run() {
    try {
      const { flags, args } = await this.parse(OperationsCheck);

      await this.require(flags);

      const endpoint = this.ensure({
        key: 'registry.endpoint',
        args: flags,
        legacyFlagName: 'registry',
        defaultValue: graphqlEndpoint,
        env: 'HIVE_REGISTRY',
      });
      const accessToken = this.ensure({
        key: 'registry.accessToken',
        args: flags,
        legacyFlagName: 'token',
        env: 'HIVE_TOKEN',
        message: ACCESS_TOKEN_MISSING,
      });
      const graphqlTag = flags.graphqlTag;
      const globalGraphqlTag = flags.globalGraphqlTag;

      const file: string = args.file;

      const operations = await loadOperations(file, {
        normalize: false,
        pluckModules: graphqlTag?.map(tag => {
          const [name, identifier] = tag.split(':');
          return {
            name,
            identifier,
          };
        }),
        pluckGlobalGqlIdentifierName: globalGraphqlTag,
      });

      if (operations.length === 0) {
        this.logInfo('No operations found');
        this.exit(0);
        return;
      }

      const result = await this.registryApi(endpoint, accessToken).request({
        operation: fetchLatestVersionQuery,
      });

      const sdl = result.latestValidVersion?.sdl;

      if (!sdl) {
        this.error('Could not find a published schema. Please publish a valid schema first.');
      }

      const schema = buildSchema(sdl, {
        assumeValidSDL: true,
        assumeValid: true,
      });

      if (!flags.apolloClient) {
        const detectedApolloDirectives = operations.some(
          s => s.content.includes('@client') || s.content.includes('@connection'),
        );

        if (detectedApolloDirectives) {
          this.warn(
            'Apollo Client specific directives detected (@client, @connection). Please use the --apolloClient flag to enable support.',
          );
        }
      }

      const invalidOperations = validate(
        schema,
        operations.map(s => new Source(s.content, s.location)),
        {
          apollo: flags.apolloClient === true,
        },
      );

      const operationsWithErrors = invalidOperations.filter(o => o.errors.length > 0);

      if (operationsWithErrors.length === 0) {
        this.logSuccess(`All operations are valid (${operations.length})`);
        this.exit(0);
        return;
      }

      this.log(Texture.header('Summary'));
      this.log(
        [
          `Total: ${operations.length}`,
          `Invalid: ${operationsWithErrors.length} (${Math.floor(
            (operationsWithErrors.length / operations.length) * 100,
          )}%)`,
          '',
        ].join('\n'),
      );

      this.log(Texture.header('Details'));

      this.printInvalidDocuments(operationsWithErrors);
      this.exit(1);
    } catch (error) {
      if (error instanceof Errors.ExitError) {
        throw error;
      } else {
        this.logFailure('Failed to validate operations');
        this.handleFetchError(error);
      }
    }
  }

  private printInvalidDocuments(invalidDocuments: InvalidDocument[]): void {
    invalidDocuments.forEach(doc => {
      this.renderErrors(doc.source.name, doc.errors);
    });
  }

  private renderErrors(sourceName: string, errors: GraphQLError[]) {
    this.logFailure(sourceName);
    errors.forEach(e => {
      this.log(` - ${Texture.boldQuotedWords(e.message)}`);
    });
    this.log('');
  }
}
