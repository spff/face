<template>
  <div class="root">
    <div class="main" data-ratio="16:9">
      <div class="preview">
        <template v-for="image in images" >
          <img :src="image.url" :key="image.text" :z-index="image.z" class="preview_item">
        </template>
        <img src="@/assets/frame_render.png" z-index="20" class="preview_item">
      </div>
      <div class="menu">
        <div v-for="menu in menus" class="menu_item" :key="menu.index">
          <img :src="require('@/assets/menu/' + menu.index + (menuChose === menu.index ? '' : '_f') +'.png')"  class="menu_img" @click="chooseMenu(menu.index)">
        </div>
      </div>
      <div class="option_container">
        <div class="option">
          <div v-for="option in options" class="option_item" :key="option.index">
            <div class="option_item_inner">
            <img :src="option.url"  class="option_img" :class="{ option_img_chosen: option.name.split('.')[0] === optionsCombination[menuChose].value}" @click="chooseOption(option)">
            </div>
          </div>
        </div>
      </div>
      <div class="scrollbar">
        <img src="@/assets/scrollbar_track.png" class="scrollbar_track">
      </div>
      <div class="download">
        <img class="download_img" src="@/assets/confirm.png" @click="send"/>
      </div>
    </div>
    <div class="dummy">
      <img src="@/assets/background_padding.png">
    </div>
  </div>
</template>

<script>
import * as JSZip from 'jszip'
import axios from 'axios'

export default {
  name: 'HelloWorld',
  data () {
    return {
      menuChose: 0,
      optionsCombination: [...this.sortedOptionMap.values()].map(it => { return { key: it.key, value: it.default } }),
      menus: [...this.sortedOptionMap.values()]
        .map(it => ({ key: it.key, index: it.index, show: it.showInOption }))
        .filter(it => it.show)
        .map(it => ({ key: it.key, index: it.index })),
      optionsBlob: null
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
    },
    options: function () {
      if (this.optionsBlob == null) {
        return []
      } else {
        const obj = this.optionsBlob[[...this.sortedOptionMap.values()][this.menuChose].key]
        const rawOptions = Object.keys(obj)
          .map((it, index) => ({url: obj[it], name: it, index: index}))
        while (rawOptions.length % 3 !== 0) {
          rawOptions.push({url: require('@/assets/empty.png'), name: 'empty.png', index: rawOptions.size})
        }
        return rawOptions
      }
      /* .keys()
        .map((it, index) => (
          {
            index: index
          }
        )) */
    }
  },
  created: function () {
    this.initWebSocket()

    axios({
      methods: 'get',
      url: require('@/assets/option.zip'),
      responseType: 'arraybuffer'
    })
      .then(response => {
        return JSZip.loadAsync(response.data)
      })
      .then(contents =>
        Promise.all(
          Object
            .keys(contents.files)
            .filter(fileName => fileName.endsWith('.png'))
            .map(fileName =>
              contents.files[fileName]
                .async('blob')
                .then(blob =>
                  [
                    fileName, // keep the link between the file name and the content
                    URL.createObjectURL(blob) // create an url. img.src = URL.createObjectURL(...) will work
                  ]
                )
            )
        )
      )
      .then(result => {
        // we have here an array of [fileName, url]
        // if you want the same result as imageSrc:

        return result.reduce((acc, val) => {
          const path = this.split2s(val[0], '/')
          const dir = path[0]
          const tail = path[1]
          if (acc[dir] == null) {
            acc[dir] = {}
          }
          acc[dir][tail] = val[1]
          return acc
        }, {})
      })
      .then(result => {
        this.optionsBlob = result
      })
      .catch(function (e) {
        console.error(e)
      })
  },
  destroyed: function () {
    this.websock.close()
  },
  methods: {
    split2s: function (str, delim) {
      var p = str.indexOf(delim)
      if (p !== -1) {
        return [str.substring(0, p), str.substring(p + 1)]
      } else {
        return [str]
      }
    },
    chooseMenu: function (value) {
      this.menuChose = value
    },
    chooseOption: function (value) {
      if (value.name !== 'empty.png') {
        this.optionsCombination[this.menuChose].value = value.name.split('.')[0]
      }
    },
    send: function () {
      this.websocketsend(JSON.stringify(this.layersCombination))
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
<style scoped lang="scss">
@mixin BoxShadow ($dp) {
    @if $dp==0 {
        box-shadow: none
    }
    @else if $dp==1 {
        box-shadow: 0 1px 1px 0 rgba(0, 0, 0, 0.14), 0 2px 1px -1px rgba(0, 0, 0, 0.12), 0 1px 3px 0 rgba(0, 0, 0, 0.20)
    }
    @else if $dp==2 {
        box-shadow: 0 2px 2px 0 rgba(0, 0, 0, 0.14), 0 3px 1px -2px rgba(0, 0, 0,0.12), 0 1px 5px 0 rgba(0, 0, 0, 0.20)
    }
    @else if $dp==3 {
        box-shadow: 0 3px 4px 0 rgba(0, 0, 0, 0.14), 0 3px 3px -2px rgba(0, 0, 0,0.12), 0 1px 8px 0 rgba(0, 0, 0,0.20)
    }
    @else if $dp==4 {
        box-shadow: 0 4px 5px 0 rgba(0, 0, 0, 0.14), 0 1px 10px 0 rgba(0, 0, 0,0.12), 0 2px 4px -1px rgba(0, 0, 0,0.20)
    }
    @else if $dp==6 {
        box-shadow: 0 6px 10px 0 rgba(0, 0, 0, 0.14), 0 1px 18px 0 rgba(0, 0, 0,0.12), 0 3px 5px -1px rgba(0, 0, 0,0.20)
    }
    @else if $dp==8 {
        box-shadow: 0 8px 10px 1px rgba(0, 0, 0, 0.14), 0 3px 14px 2px rgba(0, 0, 0,0.12), 0 5px 5px -3px rgba(0, 0, 0,0.20)
    }
    @else if $dp==9 {
        box-shadow: 0 9px 12px 1px rgba(0, 0, 0, 0.14), 0 3px 16px 2px rgba(0, 0, 0,0.12), 0 5px 6px -3px rgba(0, 0, 0,0.20)
    }
    @else if $dp==12 {
        box-shadow: 0 12px 17px 2px rgba(0, 0, 0, 0.14), 0 5px 22px 4px rgba(0, 0, 0,0.12), 0 7px 8px -4px rgba(0, 0, 0,0.20)
    }
    @else if $dp==16 {
        box-shadow: 0 16px 24px 2px rgba(0, 0, 0, 0.14), 0 6px 30px 5px rgba(0, 0, 0,0.12), 0 8px 10px -5px rgba(0, 0, 0,0.20)
    }
    @else if $dp==24 {
        box-shadow: 0 24px 38px 3px rgba(0, 0, 0, 0.14), 0 9px 46px 8px rgba(0, 0, 0,0.12), 0 11px 15px -7px rgba(0, 0, 0,0.20)
    }
}

@mixin CenterHorizontal () {
  left: 50%;
  transform: translate(-50%, 0%);
}

a {
  color: #42b983;
}
.root {
  display: grid;
  height: 100vh;
  grid-template-rows: auto 1fr;
}

.main {
  grid-row: 1 / 2;
  display: grid;
  max-height: 100vh;
  grid-template-columns: 66fr 370fr 35fr 10fr 408fr 10fr 7fr 23fr 75fr;
  // grid-template-columns: 66fr 370fr 40fr 5fr 408fr 5fr 12fr 23fr 75fr;
  grid-template-rows: 98fr 25fr 35fr 35fr 410fr 25fr 20fr 55fr;
}

.dummy {
  grid-row: 2 / 3;
  height: auto;
  width: auto;
  overflow: hidden;
}

.preview {
  position: relative;
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: 1fr;
  grid-column: 2 / 3;
  grid-row: 2 / 7;
  @include BoxShadow(24);
}

.preview_item {
  position: absolute;
  width: 100%;
  height: auto;
}

.menu {
  display: grid;
  grid-template-rows: 1fr;
  grid-column: 4 / 7;
  grid-row: 3 / 4;
}
 .menu_item {
  position: relative;
  grid-row: 1 / 2;
 }

.menu_img {
  position: absolute;
  width: auto;
  height: auto;
  max-width: 100%;
  max-height: 100%;
  border-radius:11px;
  @include BoxShadow(4);
  @include CenterHorizontal();
}

.option_container {
  position: relative;
  grid-column: 5 / 6;
  grid-row: 5 / 6;
  overflow: hidden;
  line-height: 1px;
}

.option {
  display: flex;
  flex-wrap: wrap;
  position: absolute;
}

.option_item {
  flex: 0 0 33.3333%;
}
.option_item_inner {
  margin: 1px;
}
.option_img {
  width: auto;
  height: auto;
  max-width: 100%;
  max-height: 100%;
  border-radius:12px;
  border: 2px solid transparent;
  box-sizing: border-box;
}
.option_img_chosen {
  border: 2px solid #DA317E;
}
.scrollbar {
  position: relative;
  grid-column: 8 / 9;
  grid-row: 5 / 6;
}

.scrollbar_track {
  position: absolute;
  height: auto;
  @include CenterHorizontal();
  max-width: 100%;
  max-height: 100%;
}

.scrollbar_thumb {

}

.download {
  grid-column: 9 / 10;
  grid-row: 8 / 9;
}
.download_img {
  width: 100%;
  height: auto;
}

</style>
