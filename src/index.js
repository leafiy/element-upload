import ElUpload from "./index.vue";

ElUpload.install = function(Vue) {
  Vue.component(ElUpload.name, ElUpload);
};

export default ElUpload;
