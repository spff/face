<template>
  <div class="root">
    <div class="main">
      <div class="preview">
        <template v-for="image in images" >
          <img :src="image.url" :key="image.text" :z-index="image.z" class="preview_item">
        </template>
        <img src="@/assets/frame_render.png" z-index="20" class="frame_render">
      </div>
      <div class="menu">
        <div v-for="menu in menus" class="menu_item" :key="menu.index">
          <img :src="require('@/assets/menu/' + menu.index + (menuChose === menu.index ? '' : '_f') +'.png')"  class="menu_img" @click="chooseMenu(menu.index)">
        </div>
      </div>
      <div ref="option_container" class="option_container">
        <div class="option">
          <div v-for="option in options" class="option_item" :key="option.index">
            <div class="option_item_inner">
            <img :src="option.url"  class="option_img" :class="{ option_img_chosen: option.name.split('.')[0] === optionsCombination[menuChose].value}" @click="chooseOption(option)">
            </div>
          </div>
        </div>
      </div>
      <div ref="scrollbar" class="scrollbar" @mousedown="mousedown" @mousemove="mousemove">
        <img src="@/assets/scrollbar_track.png" class="scrollbar_track">
        <img ref="thumb" src="@/assets/scrollbar_thumb.png" class="scrollbar_thumb" @touchstart="touchdown" @touchmove="touchmove">
      </div>
      <div class="download">
        <img class="download_img" src="@/assets/confirm.png" @click="send"/>
      </div>
    </div>
    <div class="dummy">
      <img src="@/assets/background_padding.png">
    </div>
    <img v-show="this.showNotDone" src="@/assets/not_done.png" class="dialog" @click="closeDialog">
    <img v-show="this.showDone" src="@/assets/done.png" class="dialog" @click="closeDialog">
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
      optionsCombination: this.getDefaultOptionsCombination(),
      menus: [...this.sortedOptionMap.values()]
        .map(it => ({ key: it.key, index: it.index, show: it.showInOption }))
        .filter(it => it.show)
        .map(it => ({ key: it.key, index: it.index })),
      fsBlob: null,
      thumbPositionPercentage: 0,
      offset: 0,
      wsKeepAlive: null,
      showNotDone: false,
      showDone: false
    }
  },
  computed: {
    isComplete: function () {
      return this.optionsCombination.every(it => it.value != null)
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
      if (this.fsBlob == null) {
        return []
      } else {
        return this.layersCombination
          .map((it, index) => (
            {
              // url: this.getRender(it.layer + '/' + it.choice + '.png'),
              url: this.fsBlob['render'][it.layer][it.choice + '.png'],
              text: index.toString(),
              z: index
            }
          ))
          .filter(it => it.url != null)
      }
    },
    options: function () {
      if (this.fsBlob == null) {
        return []
      } else {
        const obj = this.fsBlob['option'][[...this.sortedOptionMap.values()][this.menuChose].key]
        const rawOptions = Object.keys(obj)
          .map((it, index) => ({url: obj[it], name: it, index: index}))
        while (rawOptions.length % 3 !== 0) {
          rawOptions.push({url: require('@/assets/empty.png'), name: 'empty.png', index: rawOptions.size})
        }
        return rawOptions
      }
    }
  },
  created: function () {
    axios({
      methods: 'get',
      url: require('@/assets/zip.zip'),
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
          const path = val[0].split('/')
          const dirs = path.slice(0, path.length - 1)
          const tail = path[path.length - 1]
          const innestDir = dirs.reduce((parent, dir) => {
            if (parent[dir] == null) {
              parent[dir] = {}
            }
            return parent[dir]
          }, acc)

          innestDir[tail] = val[1]
          return acc
        }, {})
      })
      .then(result => {
        this.fsBlob = result
      })
      .catch(function (e) {
        console.error(e)
      })
  },
  destroyed: function () {
    this.websock.close()
  },
  beforeDestroy: function () {
    window.removeEventListener('resize', this.handleWindowResize)
  },
  mounted () {
    window.addEventListener('resize', this.handleWindowResize)
  },
  watch: {
    thumbPositionPercentage: function (val) {
      this.implScroll()
    }
  },
  methods: {
    handleWindowResize: function (event) {
      this.implScroll()
    },
    implScroll: function () {
      const val = this.thumbPositionPercentage
      const v = this.$refs.option_container
      const maxScrollTop = v.scrollHeight - v.clientHeight

      if (maxScrollTop <= 0) {
        v.scrollTop = 0
      } else {
        v.scrollTop = maxScrollTop * val
        const whole = this.$refs.scrollbar
        const thumb = this.$refs.thumb
        const scrollMax = whole.clientHeight - thumb.clientHeight
        // console.log(val, scrollMax, val * scrollMax)
        thumb.style.top = Math.min(1, Math.max(0, val)) * scrollMax + 'px'
      }
    },
    chooseMenu: function (value) {
      if (this.menuChose !== value) {
        this.menuChose = value
        this.thumbPositionPercentage = 0
      }
    },
    chooseOption: function (value) {
      if (value.name !== 'empty.png') {
        this.optionsCombination[this.menuChose].value = value.name.split('.')[0]
      }
    },
    mousedown: function (event) {
      event.preventDefault()
      const thumb = this.$refs.thumb
      const rect = thumb.getBoundingClientRect()
      if (event.clientY >= rect.top && event.clientY <= rect.top + rect.height) {
        this.offset = event.clientY - thumb.getBoundingClientRect().top
      }
    },
    mousemove: function (event) {
      event.preventDefault()
      if (event.buttons > 0) {
        this.move(event.clientY)
      }
    },
    touchdown: function (event) {
      event.preventDefault()
      const thumb = this.$refs.thumb
      this.offset = event.touches[0].clientY - thumb.getBoundingClientRect().top
    },
    touchmove: function (event) {
      event.preventDefault()
      this.move(event.touches[0].clientY)
    },
    move: function (y) {
      const whole = this.$refs.scrollbar
      const thumb = this.$refs.thumb
      const scroll = y - this.offset - whole.getBoundingClientRect().top
      const scrollMax = whole.clientHeight - thumb.clientHeight
      this.thumbPositionPercentage = scroll / scrollMax
      // console.log('tm', y, whole.getBoundingClientRect().top, whole.clientHeight - thumb.clientHeight)
    },
    sendLog: function (msg) {
      console.log(msg)
      // axios.post('https://hooks.slack.com/services/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',
      //   msg,
      //   {
      //     'Access-Control-Allow-Origin': '*'
      //   }
      // )
      //   .catch(err => {
      //     console.log('err ' + err)
      //   })
    },
    sendPost: function (retryTimes) {
      if (retryTimes < 0) {
        return
      }
      let ssl = ''
      if (location.protocol.includes('s')) {
        ssl = 's'
      }

      axios.post(
        'http' + ssl + '://' + window.location.hostname,
        this.layersCombination,
        {'Content-Type': 'application/json'}
      ).then(response => {
        this.sendLog({text: JSON.stringify({
          role: 'client',
          event: 'post_sent',
          response: response
        })})
      })
        .catch(err => {
          console.log(err)
          this.sendPost(retryTimes - 1)
          this.sendLog({text: JSON.stringify({
            role: 'client',
            event: 'post_failed',
            err: err
          })})
        })
    },
    send: function () {
      if (this.isComplete) {
        this.sendPost(5)
        this.optionsCombination = this.getDefaultOptionsCombination()
        this.menuChose = 0
        this.showDone = true
      } else {
        this.showNotDone = true
      }
    },
    getDefaultOptionsCombination: function () {
      return [...this.sortedOptionMap.values()].map(it => { return { key: it.key, value: it.default } })
    },
    closeDialog: function () {
      this.showNotDone = false
      this.showDone = false
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

@mixin Center () {
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
}

a {
  color: #42b983;
}
.root {
  display: grid;
  height: 90vh;
  width: 133vh;
  grid-template-rows: auto auto;
}

.main {
  grid-row: 1 / 2;
  display: grid;
  // 4:3
  height: 90vh;
  //height: 75vw;
  grid-template-columns: 66fr 370fr 35fr 9fr 410fr 9fr 7fr 23fr 75fr;
  // grid-template-columns: 66fr 370fr 40fr 5fr 408fr 5fr 12fr 23fr 75fr;
  grid-template-rows: 98fr 25fr 35fr 35fr 405fr 25fr 20fr 50fr 55fr;
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
  @include BoxShadow(16);
}

.preview_item {
  position: absolute;
  // 1028 / 1163
  width: 88.39208%;
  height: auto;
  left: 50%;
  // 98 / 1670
  top: 5.8682634%;
  transform: translate(-50%, 0%);
}

.frame_render {
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
  height: 100%;
  padding-left: 4px;
  padding-right: 4px;
  align-content:flex-start;
}

.option_item {
  flex: 0 0 33.3333%;
}
.option_item_inner {
  margin: 0px;
}
.option_img {
  width: auto;
  height: auto;
  max-width: 100%;
  max-height: 100%;
  border-radius:12px;
  border: 3px solid transparent;
  box-sizing: border-box;
}
.option_img_chosen {
  border: 3px solid #DA317E;
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
  user-drag: none;
  user-select: none;
  -moz-user-select: none;
  -webkit-user-drag: none;
  -webkit-user-select: none;
  -ms-user-select: none;
}

.scrollbar_thumb {
  position: absolute;
  height: auto;
  @include CenterHorizontal();
  max-width: 100%;
  max-height: 100%;
  top: 0%;
  user-drag: none;
  user-select: none;
  -moz-user-select: none;
  -webkit-user-drag: none;
  -webkit-user-select: none;
  -ms-user-select: none;
}

.download {
  grid-column: 9 / 10;
  grid-row: 8 / 9;
}
.download_img {
  width: 100%;
  height: auto;
}

.dialog {
  position: fixed;
  width: 29.5295vw;
  height: 13.013vw;
  @include Center();
  @include BoxShadow(24);
}

</style>
