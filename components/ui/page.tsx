export const PageContainer = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-6 sm:px-6">
      {children}
    </div>
  );
};

export const PageSectionTitle = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <h3 className="text-sm font-semibold uppercase tracking-wide text-foreground/80">
      {children}
    </h3>
  );
};

export const PageSectionContent = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return <div className="space-y-3">{children}</div>;
};

export const PageSectionScroller = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <div className="flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-1 [&::-webkit-scrollbar]:hidden">
      {children}
    </div>
  );
};
