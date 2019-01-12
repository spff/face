<template>
  <div >
    <div class="preview">
      <img v-if="image != null" :src="image.url" :alt="image.text" :title="image.text" class="preview_item">
      <div class="status">
        {{status}}
      </div>
    </div>
    <div class="list">
      <div v-for="face in list" @click="compose(face.time)" :key="face.time" class="block">
        <div class="panel-in-block">
          {{face.time}}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import mergeImages from 'merge-images'
import b64toBlob from 'b64-to-blob'
export default {
  name: 'Print',
  data () {
    return {
      image: null,
      status: '',
      list: [
        { time: 500 },
        { time: 600 },
        { time: 700 },
        { time: 800 },
        { time: 900 },
        { time: 100 },
        { time: 110 },
        { time: 200 },
        { time: 300 },
        { time: 400 },
        { time: 510 },
        { time: 520 },
        { time: 530 },
        { time: 540 },
        { time: 650 }
      ]
    }
  },
  computed: {
  },
  methods: {
    compose (key) {
      this.status = 'loading'
      const rand = order.map(element => element + '_0' + Math.floor((Math.random() * 2) + 1).toString() + '.png')
      mergeImages(rand.map(it => require('@/assets/large_' + it)))
        .then(b64 => {
          const binaryData = []
          binaryData.push(b64toBlob(b64.substring(b64.indexOf(',') + 1)))
          if (this.image != null) {
            URL.revokeObjectURL(this.image.url)
          }
          this.image = {
            url: window.URL.createObjectURL(new Blob(binaryData, {type: 'image/png'})),
            text: Date.now()
          }
          this.status = key
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

.root {
  overflow: hidden;
  position: absolute;
}
.preview {
  width: auto;
  height: 30vh;
}

.preview_item {
  width: auto;
  height: 90%;
}

.status {
  width: 100%;
  height: 10%;
}

.list {
  width: 100%;
  height: 65vh;
  overflow-y: scroll;
}

.block {
  margin-top: 10px;
  padding-bottom: 5px;
  padding-left: 4px;

  border: 2px solid rgb(200, 200, 255);
  border-radius: 5px;
  background-color: rgb(220, 220, 220);
  font-size: 20px;
  font-family: "Open Sans", sans-serif;
}

.panel-in-block {
  height: 16px;
  padding-top: 5px;
  padding-bottom: 0px;
  padding-right: 5px;
}

</style>
