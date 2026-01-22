type PipelineTransform<Input = unknown, Output = unknown> = (
  x: Input
) => Output;
export const pipeline =
  <Input, Output>(...fns: Array<PipelineTransform<Input, Output>>) =>
  (x: Input) =>
    fns.reduce((v, f) => f(v) as unknown as Input, x) as unknown as Output;
