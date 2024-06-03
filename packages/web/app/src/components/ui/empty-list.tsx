import { ReactElement } from 'react';
import magnifier from '../../../public/images/figures/magnifier.svg?url';
import { cn } from '@/lib/utils';
import { Card, CardHeader } from './card';
import { DocsLink } from './docs-note';

export const EmptyList = ({
  title,
  description,
  docsUrl,
  className,
}: {
  title: string;
  description: string;
  docsUrl?: string | null;
  className?: string;
}): ReactElement => {
  return (
    <Card
      className={cn('flex grow cursor-default flex-col items-center gap-y-2', className)}
      data-cy="empty-list"
    >
      <img
        src={magnifier}
        alt="Magnifier illustration"
        width="200"
        height="200"
        className="drag-none"
      />
      <CardHeader className="text-center">{title}</CardHeader>
      <span className="text-center text-sm font-medium text-gray-500">{description}</span>
      {docsUrl && <DocsLink href={docsUrl}>Read about it in the documentation</DocsLink>}
    </Card>
  );
};

export const noSchema = (
  <EmptyList
    title="Schema Registry contains no schema"
    description="You can publish a schema with Hive CLI and Hive Client"
    docsUrl="/features/schema-registry#publish-a-schema"
  />
);

export const noSchemaVersion = (
  <EmptyList
    title="Hive is waiting for your first schema"
    description="You can publish a schema with Hive CLI and Hive Client"
    docsUrl="/features/schema-registry#publish-a-schema"
  />
);

export const noValidSchemaVersion = (
  <EmptyList
    title="Hive is waiting for your first composable schema version"
    description="You can publish a schema with Hive CLI and Hive Client"
    docsUrl="/features/schema-registry#publish-a-schema"
  />
);