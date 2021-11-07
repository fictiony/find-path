<template>
  <div style="width: 340px">
    <p class="text-h5">
      {{ appTitle }}
      <q-avatar class="float-right" size="80px">
        <q-img src="~assets/icon.png" draggable="false" />
      </q-avatar>
    </p>
    <p>{{ appDesc || '无介绍' }}</p>
    <label class="text-caption text-grey">版本：{{ appVer }}<br />作者：{{ appAuthor }}</label>
  </div>
</template>

<script>
// 【关于对话框】
import { mapState } from 'vuex'

export default {
  computed: {
    ...mapState('main', ['appTitle', 'appDesc', 'appVer', 'appAuthor'])
  }
}
</script>
