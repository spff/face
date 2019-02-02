<template>
  <div class="root">
    <div class="preview">
      <template v-for="image in images" >
        <img :src="image.url" :alt="image.text" :title="image.text" :key="image.text" :z-index="image.z" class="preview_item">
      </template>
    </div>
    <div class="download">
      <button type="button" @click="send">
        Send
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'HelloWorld',
  data () {
    return {
      menuChose: '01',
      optionsCombination: [...this.sortedOptionMap.values()].map(it => { return { key: it.key, value: it.default } })
    }
  },
  computed: {
    isComplete: function () {
      return this.optionsCombination.every(it => it != null)
    },
    layersCombination: function () {
      const c = this.optionsCombination
        // null means not yet chosen, 0 means nothing
        .filter(it => it.value != null && it.value !== '0')
        .map(it =>
          this.sortedOptionMap.get(it.key).target
            .map(layer => ({ layer: layer, choice: it.value }))
        )
        .flat()

      c.sort((a, b) => this.sortedLayerMap.get(a.layer) - this.sortedLayerMap.get(b.layer))
      return c
    },
    images: function () {
      return this.layersCombination
        .map((it, index) => (
          {
            url: this.getRender(it.layer + '/' + it.choice + '.png'),
            text: index.toString(),
            z: index
          }
        ))
        .filter(it => it.url != null)
    }
  },
  created: function () {
    this.initWebSocket()
  },
  destroyed: function () {
    this.websock.close()
  },
  methods: {
    getOption: function (path) {
      try {
        return require('@/assets/option/' + path)
      } catch (e) {
        return null
      }
    },
    trans: function (options) {

    },
    send: function () {
      this.websocketsend(JSON.stringify(this.optionsCombination))
    },
    initWebSocket () {
      let ssl = ''
      if (location.protocol.includes('s')) {
        ssl = 's'
      }
      const wsuri = 'ws' + ssl + '://' + window.location.hostname
      this.websock = new WebSocket(wsuri)
      this.websock.onmessage = this.websocketonmessage
      this.websock.onopen = this.websocketonopen
      this.websock.onerror = this.websocketonerror
      this.websock.onclose = this.websocketclose
    },
    websocketonerror () {
      this.initWebSocket()
    },
    websocketsend (Data) {
      this.websock.send(Data)
    },
    websocketclose (e) {
      console.log('断开连接', e)
    }
  }
}

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
