import {
  HTMLAttributes,
  isValidElement,
  ReactElement,
  useEffect,
  useState,
} from "react";
import { Placeholder } from "./placeholder";

type PictureProps = {
  children: ReactElement<{ [key: string]: any; className: string }>;
  identifier: any | null | undefined;
  className?: string;
  style?: HTMLAttributes<any>["style"];
};
export const Picture = ({
  children,
  identifier,
  className: pClassName,
  style: pStyle,
}: PictureProps) => {
  const [error, setError] = useState(false);
  const className = isValidElement(children) ? children.props.className : "";

  useEffect(() => {
    setError(false);
  }, [children]);

  if (!identifier || error) {
    return <Placeholder className={className} />;
  }
  return (
    <picture
      style={pStyle}
      className={pClassName}
      onErrorCapture={() => setError(true)}
    >
      {children}
    </picture>
  );
};
