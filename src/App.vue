<template>
  <div id="app" :class="appTheme">
    <Aside />
    <div class="zy-body">
      <Frame />
      <Film v-show="view === 'Film'" />
      <Play v-show="view === 'Play'" />
      <IPTV v-show="view === 'IPTV'" />
      <Star v-show="view === 'Star'" />
      <History v-show="view === 'History'" />
      <Setting v-show="view === 'Setting'" />
      <EditSites v-if="view === 'EditSites'"/>
      <Recommandation v-show="view === 'Recommandation'" />
    </div>
    <transition name="slide">
      <Detail v-if="detail.show"/>
    </transition>
    <transition name="slide">
      <Share v-if="share.show"/>
    </transition>
  </div>
</template>

<script>
export default {
  name: 'App',
  data () {
    return {
      appTheme: 'theme-light'
    }
  },
  computed: {
    view () {
      return this.$store.getters.getView
    },
    detail () {
      return this.$store.getters.getDetail
    },
    share () {
      return this.$store.getters.getShare
    },
    setting () {
      return this.$store.getters.getSetting
    },
    editSites () {
      return this.$store.getters.getEditSites
    },
    recommandation () {
      return this.$store.getters.recommandation
    }
  },
  watch: {
    setting: {
      handler () {
        this.changeSetting()
      },
      deep: true
    }
  },
  methods: {
    changeSetting () {
      this.appTheme = `theme-${this.setting.theme}`
    }
  }
}
</script>

<style lang="scss">
@import './assets/scss/theme.scss';
html, body, #app{
  height: 100%;
  border-radius: 0px;
}
#app {
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', SimSun, sans-serif;
  -webkit-font-smoothing: antialiased;
  -webkit-tap-highlight-color: transparent;
  width: 100%;
  height: 100%;
  overflow: hidden;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  .zy-body{
    flex: 1;
    height: 100%;
    display: flex;
    justify-content: flex-start;
    align-items: flex-start;
    flex-direction: column;
    padding: 0 20px 20px;
  }
}
</style>
