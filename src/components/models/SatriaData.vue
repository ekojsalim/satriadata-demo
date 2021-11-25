<template>
  <SatriaDataUI
    :modelFilepath="modelFilepath"
    :imageSize="224"
    :imageUrls="imageUrls"
    :preprocess="preprocess"
    :getPredictedClass="getPredictedClass"
    :getAge="getAge"
  ></SatriaDataUI>
</template>

<script lang="ts">
import ndarray from "ndarray";
import ops from "ndarray-ops";
import SatriaDataUI from "../common/SatriaDataUI.vue";
import { Tensor } from "onnxruntime-web";
import { Vue, Component } from "vue-property-decorator";
import { satriaDataUtils, mathUtils } from "../../utils/index";

const MODEL_FILEPATH_PROD = `/satriadata-demo/mtaenet.onnx`;
const MODEL_FILEPATH_DEV = "/mtaenet.onnx";

const SATRIADATA_IMAGE_URLS = [
  { text: "Pria 1", value: "https://i.ibb.co/NTYqq96/p1.jpg" },
  { text: "Pria 2", value: "https://i.ibb.co/tpb4rXY/p2.jpg" },
  {
    text: "Pria 3",
    value: "https://i.ibb.co/stb31nZ/p3.jpg",
  },

  {
    text: "Perempuan 1",
    value: "https://i.ibb.co/PY4bHTc/f1.jpg",
  },
  {
    text: "Perempuan 2",
    value: "https://i.ibb.co/x1WK617/f2.jpg",
  },
  {
    text: "Perempuan 3",
    value: "https://i.ibb.co/3MrFvcr/f3.jpg",
  },
];

@Component({
  components: {
    SatriaDataUI,
  },
})
export default class SatriaDataNet extends Vue {
  modelFilepath: string;
  imageUrls: Array<{ text: string; value: string }>;

  constructor() {
    super();
    this.modelFilepath =
      process.env.NODE_ENV === "production"
        ? MODEL_FILEPATH_PROD
        : MODEL_FILEPATH_DEV;
    this.imageUrls = SATRIADATA_IMAGE_URLS;
  }

  preprocess(ctx: CanvasRenderingContext2D): Tensor {
    const imageData = ctx.getImageData(
      0,
      0,
      ctx.canvas.width,
      ctx.canvas.height
    );
    const { data, width, height } = imageData;

    // data processing
    const dataTensor = ndarray(new Float32Array(data), [width, height, 4]);
    const dataProcessedTensor = ndarray(new Float32Array(width * height * 3), [
      1,
      3,
      width,
      height,
    ]);

    ops.assign(
      dataProcessedTensor.pick(0, 0, null, null),
      dataTensor.pick(null, null, 0)
    );
    ops.assign(
      dataProcessedTensor.pick(0, 1, null, null),
      dataTensor.pick(null, null, 1)
    );
    ops.assign(
      dataProcessedTensor.pick(0, 2, null, null),
      dataTensor.pick(null, null, 2)
    );

    ops.divseq(dataProcessedTensor, 255);
    ops.subseq(dataProcessedTensor.pick(0, 0, null, null), 0.485);
    ops.subseq(dataProcessedTensor.pick(0, 1, null, null), 0.456);
    ops.subseq(dataProcessedTensor.pick(0, 2, null, null), 0.406);

    ops.divseq(dataProcessedTensor.pick(0, 0, null, null), 0.229);
    ops.divseq(dataProcessedTensor.pick(0, 1, null, null), 0.224);
    ops.divseq(dataProcessedTensor.pick(0, 2, null, null), 0.225);

    const tensor = new Tensor("float32", new Float32Array(width * height * 3), [
      1,
      3,
      width,
      height,
    ]);
    (tensor.data as Float32Array).set(dataProcessedTensor.data);
    return tensor;
  }

  getAge(res: Float32Array): {} {
    return res.length > 0
      ? res.map((v, i) => Math.exp(v) * (i + 1)).reduce((a, b) => a + b)
      : 0;
  }

  getPredictedClass(res: Float32Array): {} {
    console.log(res);
    if (!res || res.length === 0) {
      const empty = [];
      for (let i = 0; i < 2; i++) {
        empty.push({ name: "-", probability: 0, index: 0 });
      }
      return empty;
    }
    const output = mathUtils.softmax(Array.prototype.slice.call(res));
    return satriaDataUtils.satriaDataGenderParse(output);
  }
}
</script>
