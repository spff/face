<template>
  <div >
    <div class="preview">
      <img v-if="image != null" :src="image.url" :alt="image.text" :title="image.text" class="preview_item">
      <div class="status">
        {{status}}
      </div>
    </div>
    <div class="list">
      <div v-for="(face, index) in list" @click="compose(index)" :key="face.time" class="block">
        <div class="panel-in-block"  :class="{ chosen_panel: face.time === chosenTime}">
          {{face.time}}<br/>{{face.data.map(it => it.layer + '_' + it.choice)}}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import mergeImages from 'merge-images'
import b64toBlob from 'b64-to-blob'
import axios from 'axios'

export default {
  name: 'Print',
  data () {
    return {
      image: null,
      status: '',
      list: [],
      chosenTime: '',
      websock: null,
      wsKeepAlive: null
    }
  },
  computed: {
  },
  created: function () {
    console.log('hi')
    this.initWebSocket()
  },
  destroyed: function () {
    this.websock.close()
  },
  methods: {
    compose (index) {
      this.status = 'loading'
      const chosen = this.list[index]
      console.log(chosen)
      this.chosenTime = chosen.time
      mergeImages(
        [
          chosen.data
            .map(it => this.getRender(it.layer + '/' + it.choice + '.png'))
            .filter(it => it != null),
          require('@/assets/frame_print.png')
        ].flat()
      )
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
          // take care reentrance for method compose()
          if (this.chosenTime === chosen.time) {
            this.status = chosen.time
          }
        })
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
    sendLog: function (msg) {
      console.log(msg)

      // axios.post('https://hooks.slack.com/services/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',
      //   msg,
      //   {
      //     'Access-Control-Allow-Origin': '*',
      //     'Access-Control-Allow-Methods': 'GET, PUT, POST, DELETE, OPTIONS',
      //     'Content-Type': 'application/json'
      //   }
      // )
      //   .catch(err => {
      //     console.log('err ' + err)
      //   })
    },
    websocketonopen () {
      this.sendLog({text: JSON.stringify({
        role: 'printer',
        event: 'ws_open'
      })})
      this.websocketsend('printer')
      this.wsKeepAlive = setInterval(() => {
        this.websocketsend('keep-alive')
      }, 1000)
    },
    websocketonerror () {
      this.sendLog({text: JSON.stringify({
        role: 'printer',
        event: 'ws_err'
      })})
      if (this.wsKeepAlive != null) {
        clearInterval(this.wsKeepAlive)
        this.wsKeepAlive = null
      }
      this.initWebSocket()
    },
    websocketsend (Data) {
      this.websock.send(Data)
    },
    websocketonmessage (e) {
      // this.list.unshift(JSON.parse(e.data))
      console.log('hi ' + e.data)
      this.sendLog({text: JSON.stringify({
        role: 'printer',
        event: 'ws_recv',
        data: e.data
      })})

      this.list = JSON.parse(e.data)
    },
    websocketclose (e) {
      if (this.wsKeepAlive != null) {
        clearInterval(this.wsKeepAlive)
        this.wsKeepAlive = null
      }
      this.sendLog({text: JSON.stringify({
        role: 'printer',
        event: 'ws_close'
      })})
      console.log('断开连接', e)
    }
  }
}

</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

.preview {
  -webkit-user-select: default;
  -webkit-touch-callout: default;
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
  height: auto;
  padding-top: 5px;
  padding-bottom: 0px;
  padding-right: 5px;
}

.chosen_panel {
  background-color: rgb(200, 220, 220);
}

</style>
