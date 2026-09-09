interface ContainerProps {
  children: React.ReactNode;
  className?: string;
  as?: 'div' | 'section' | 'main';
}

export function Container({ children, className = '', as: Tag = 'section' }: ContainerProps) {
  return (
    <Tag className={`mx-auto w-full max-w-md px-4 lg:max-w-3xl lg:px-8 ${className}`}>
      {children}
    </Tag>
  );
}
