import React from "react";
import { skeletonVariants, cn } from "../../design/variants";

interface SkeletonProps {
  className?: string;
  shape?: keyof typeof skeletonVariants.shapes;
  width?: string | number;
  height?: string | number;
  count?: number;
}

const Skeleton: React.FC<SkeletonProps> = ({
  className,
  shape,
  width,
  height,
  count = 1,
}) => {
  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === "number" ? `${width}px` : width;
  if (height) style.height = typeof height === "number" ? `${height}px` : height;

  const skeletonClass = cn(
    skeletonVariants.base,
    shape && skeletonVariants.shapes[shape],
    className
  );

  if (count === 1) {
    return <div className={skeletonClass} style={style} />;
  }

  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className={skeletonClass} style={style} />
      ))}
    </>
  );
};

export default Skeleton;
