<template>
  <div class="hello">
    <template v-for="image in images" >
      <img :src="image.url" :alt="image.text" :title="image.text" :key="image.text" :z-index="image.z" style="position: fixed;" width="auto" height="50%">
    </template>
  </div>
</template>

<script>
export default {
  name: 'HelloWorld',
  data () {
    return {
      msg: 'Welcome to Your Vue.js App',
      images: order.map((element, index) => {
        return { url: require('@/assets/' + element + '_0' + Math.floor((Math.random() * 2) + 1).toString() + '.png'), text: index.toString(), z: index }
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
h1, h2 {
  font-weight: normal;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}
</style>
