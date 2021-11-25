import _ from "lodash";
/**
 * Find top k imagenet classes
 */
export function satriaDataGenderParse(classProbabilities: any) {
  const probs = _.isTypedArray(classProbabilities)
    ? Array.prototype.slice.call(classProbabilities)
    : classProbabilities;

  const sorted = _.reverse(
    _.sortBy(
      probs.map((prob: any, index: number) => [prob, index]),
      (probIndex) => probIndex[0]
    )
  );

  const topK = _.take(sorted, 2).map((probIndex) => {
    const iClass = probIndex[1] == 0 ? [0, "Perempuan"]: [1, "Pria"];
    return {
      id: iClass[0],
      index: parseInt(probIndex[1], 10),
      name: iClass[1].replace(/_/g, " "),
      probability: probIndex[0],
    };
  });
  return topK;
}
