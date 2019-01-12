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
      combination: this.rand()
    }
  },
  computed: {
    images: function () {
      return this.combination.map((element, index) => ({ url: require('@/assets/mid_' + element + '.png'), text: index.toString(), z: index }))
    }
  },
  created: function () {
    console.log('hi')
    this.initWebSocket()
  },
  destroyed: function () {
    this.websock.close()
  },
  methods: {
    rand: function () {
      return this.order.map(element => element + '_0' + Math.floor((Math.random() * 2) + 1).toString())
    },
    send: function () {
      this.websocketsend(JSON.stringify(this.combination))
    },
    initWebSocket () {
      console.log('hi')
      let ssl = ''
      if (location.protocol.includes('s')) {
        ssl = 's'
      }
      const wsuri = 'ws://' + ssl + window.location.hostname
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
