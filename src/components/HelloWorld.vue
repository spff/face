<template>
  <div class="root">
    <div class="preview">
      <template v-for="image in images" >
        <img :src="image.url" :alt="image.text" :title="image.text" :key="image.text" :z-index="image.z" class="preview_item">
      </template>
    </div>
    <div class="download">
      <button type="button" @click="compose_and_download">
        Download
      </button>
    </div>
  </div>
</template>

<script>
import mergeImages from 'merge-images'
import b64toBlob from 'b64-to-blob'
export default {
  name: 'HelloWorld',
  data () {
    return {
      rand: order.map(element => element + '_0' + Math.floor((Math.random() * 2) + 1).toString() + '.png')
    }
  },
  computed: {
    images: function () {
      return this.rand.map((element, index) => ({ url: require('@/assets/mid_' + element), text: index.toString(), z: index }))
    }
  },
  methods: {
    compose_and_download () {
      mergeImages(this.rand.map(it => require('@/assets/large_' + it)))
        .then(b64 => {
          // const a = document.createElement('a')
          const binaryData = []
          binaryData.push(b64toBlob(b64.substring(b64.indexOf(',') + 1)))

          /* const url = window.URL.createObjectURL(new Blob(binaryData, {type: 'image/png'}))
          a.href = url
          a.download = 'aaa'
          a.click()
          URL.revokeObjectURL(a.href)
          */
          const reader = new FileReader()
          const out = new Blob(binaryData, {type: 'image/png'})
          reader.onload = function (e) {
            window.open(reader.result)
          }
          reader.readAsDataURL(out)
        })
    }
  }
}

const order = [
  'background', 'hair_back', 'body', 'cloths', 'nose', 'eyes', 'mouth', 'hair_front', 'eyebrows'
]

</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
a {
  color: #42b983;
}
.root {
  display: grid;
  background: #606;
  grid-template-columns: 1fr 1fr;

}

.preview {
  display: grid;
  background: #826;
  grid-template-columns: 1fr;
  grid-column: 1 / 2;
  position: relative;
}

.download {
  grid-column: 2 / 3;
}

.preview_item {
  position: absolute;
  width: 100%;
  height: auto;
}
</style>
