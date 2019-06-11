/**
 * Taken from ts-essentials
 * @link https://github.com/krzkaczor/ts-essentials/blob/master/lib/types.ts#L9
 */
type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends Array<infer U>
    ? Array<DeepPartial<U>>
    : T[P] extends ReadonlyArray<infer X>
      ? ReadonlyArray<DeepPartial<X>>
      : DeepPartial<T[P]>
};

export default DeepPartial;
