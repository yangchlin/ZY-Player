<template>
  <div class="listpage" id="editSites">
    <div class="listpage-content">
      <div class="listpage-header" v-show="!enableBatchEdit">
        <el-switch v-model="enableBatchEdit" active-text="批处理分组">></el-switch>
        <el-button @click="addSite" icon="el-icon-document-add">新增</el-button>
        <el-button @click="exportSites" icon="el-icon-upload2" >导出</el-button>
        <el-button @click="importSites" icon="el-icon-download">导入</el-button>
        <el-button @click="checkAllSite" icon="el-icon-refresh" :loading="checkAllSiteLoading">检测</el-button>
        <el-button @click="removeAllSites" icon="el-icon-delete-solid">清空</el-button>
        <el-button @click="resetSitesEvent" icon="el-icon-refresh-left">重置</el-button>
      </div>
      <div class="listpage-header" v-show="enableBatchEdit">
        <el-switch v-model="enableBatchEdit" active-text="批处理分组"></el-switch>
        <el-input placeholder="新组名" v-model="batchGroupName"></el-input>
        <el-switch v-model="batchIsActive" :active-value="1" :inactive-value="0" active-text="自选源"></el-switch>
        <el-button type="primary" icon="el-icon-edit" @click.stop="saveBatchEdit">保存</el-button>
      </div>
      <div class="listpage-body" id="sites-table">
        <el-table
          ref="editSitesTable"
          size="mini" fit height="100%" row-key="id"
          :data="sites"
          :key="tableKey"
          @selection-change="handleSelectionChange"
          @sort-change="handleSortChange">
          <el-table-column
            type="selection"
            v-if="enableBatchEdit">
          </el-table-column>
          <el-table-column
            prop="name"
            label="资源名">
          </el-table-column>
          <el-table-column
            prop="isActive"
            label="自选源">
            <template slot-scope="scope">
              <el-switch
                v-model="scope.row.isActive"
                :active-value="1"
                :inactive-value="0"
                @change='isActiveChangeEvent'>
              </el-switch>
            </template>
          </el-table-column>
          <el-table-column
            prop="group"
            label="分组"
            :filters="getFilters"
            :filter-method="filterHandle"
            filter-placement="bottom-end">
            <template slot-scope="scope">
              <el-button type="text">{{scope.row.group}}</el-button>
            </template>
          </el-table-column>
          <el-table-column
            label="状态"
            sortable
            :sort-by="['status']"
            width="120">
            <template slot-scope="scope">
              <span v-show="scope.row.status === ''">
                <i class="el-icon-loading"></i>
                检测中...
              </span>
              <span v-show="scope.row.status !== ''">{{scope.row.status}}</span>
            </template>
          </el-table-column>
          <el-table-column
            label="操作"
            header-align="center"
            align="right">
            <template slot-scope="scope">
              <el-button size="mini" @click.stop="moveToTopEvent(scope.row)" type="text">置顶</el-button>
              <el-button size="mini" @click.stop="editSite(scope.row)" type="text">编辑</el-button>
              <el-button size="mini" @click.stop="checkSimpleSite(scope.row)" type="text">检测</el-button>
              <el-button size="mini" @click.stop="removeEvent(scope.row)" type="text">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
    </div>
    <!-- 编辑页面 -->
    <div>
      <el-dialog :visible.sync="dialogVisible" v-if='dialogVisible' :title="dialogType==='edit'?'编辑源':'新增源'" :append-to-body="true" @close="closeDialog">
        <el-form :model="siteInfo" ref='siteInfo' label-width="75px" label-position="left" :rules="rules">
          <el-form-item label="源站名" prop='name'>
            <el-input v-model="siteInfo.name" placeholder="请输入源站名" />
          </el-form-item>
          <el-form-item label="API接口" prop='api'>
            <el-input v-model="siteInfo.api" :autosize="{ minRows: 2, maxRows: 4}" type="textarea" placeholder="请输入API接口地址"/>
          </el-form-item>
          <el-form-item label="下载接口" prop='download'>
            <el-input v-model="siteInfo.download" :autosize="{ minRows: 2, maxRows: 4}" type="textarea" placeholder="请输入Download接口地址，可以空着"/>
          </el-form-item>
          <el-form-item label="分组" prop='group'>
            <el-select v-model="siteInfo.group" allow-create filterable default-first-option placeholder="请输入分组">
              <el-option v-for="item in siteGroup" :key="item" :label="item" :value="item"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="源站标识" prop='key'>
            <el-input v-model="siteInfo.key" placeholder="请输入源站标识，如果为空，系统则自动生成" />
          </el-form-item>
        </el-form>
        <span slot="footer" class="dialog-footer">
          <el-button @click="closeDialog">取消</el-button>
          <el-button type="primary" @click="addOrEditSite">保存</el-button>
        </span>
      </el-dialog>
    </div>
   </div>
  </div>
</template>
<script>
import { mapMutations } from 'vuex'
import { sites } from '../lib/dexie'
import zy from '../lib/site/tools'
import { remote } from 'electron'
import { sites as defaultSites } from '../lib/dexie/initData'
import fs from 'fs'
import Sortable from 'sortablejs'

export default {
  name: 'editSites',
  data () {
    return {
      show: false,
      sites: [],
      dialogType: 'new',
      dialogVisible: false,
      siteInfo: {
        key: '',
        name: '',
        api: '',
        download: '',
        group: '',
        isActive: 1
      },
      siteGroup: [],
      rules: {
        name: [
          { required: true, message: '源站名不能为空', trigger: 'blur' }
        ],
        api: [
          { required: true, message: 'API地址不能为空', trigger: 'blur' }
        ],
        download: [
          { required: false, trigger: 'blur' }
        ]
      },
      enableBatchEdit: false,
      batchGroupName: '',
      batchIsActive: 1,
      multipleSelection: [],
      tableKey: 1,
      checkAllSiteLoading: false,
      editeOldkey: ''
    }
  },
  computed: {
    setting: {
      get () {
        return this.$store.getters.getSetting
      },
      set (val) {
        this.SET_SETTING(val)
      }
    },
    editSites: {
      get () {
        return this.$store.getters.getEditSites
      },
      set (val) {
        this.SET_EDITSITES(val)
      }
    },
    getFilters () {
      const groups = [...new Set(this.sites.map(site => site.group))]
      var filters = []
      groups.forEach(g => {
        var doc = {
          text: g,
          value: g
        }
        filters.push(doc)
      })
      return filters
    }
  },
  methods: {
    ...mapMutations(['SET_SETTING', 'SET_EDITSITES']),
    filterHandle (value, row) {
      return row.group === value
    },
    handleSelectionChange (rows) {
      this.multipleSelection = rows
    },
    handleSortChange (column, prop, order) {
      this.updateDatabase(this.sites)
    },
    saveBatchEdit () {
      this.multipleSelection.forEach(ele => {
        if (this.batchGroupName) {
          ele.group = this.batchGroupName
        }
        ele.isActive = this.batchIsActive
      })
      this.updateDatabase()
    },
    getSites () {
      sites.all().then(res => {
        this.sites = res
        this.editSites = {
          sites: res
        }
      })
      for (const i of this.sites) {
        delete i.status
      }
    },
    getSitesGroup () {
      const arr = []
      for (const i of this.sites) {
        if (arr.indexOf(i.group) < 0) {
          arr.push(i.group)
        }
      }
      this.siteGroup = arr
    },
    addSite () {
      this.getSitesGroup()
      this.dialogType = 'new'
      this.dialogVisible = true
      this.siteInfo = {
        key: '',
        name: '',
        api: '',
        download: '',
        group: '',
        isActive: 1
      }
    },
    editSite (siteInfo) {
      this.getSitesGroup()
      if (this.checkAllSiteLoading) {
        this.$message.info('正在检测, 请勿操作.')
        return false
      }
      this.dialogType = 'edit'
      this.dialogVisible = true
      this.siteInfo = siteInfo
      this.editeOldkey = siteInfo.key
    },
    closeDialog () {
      this.dialogVisible = false
      this.getSites()
    },
    removeEvent (e) {
      if (this.checkAllSiteLoading) {
        this.$message.info('正在检测, 请勿操作.')
        return false
      }
      sites.remove(e.id).then(res => {
        this.getSites()
      }).catch(err => {
        this.$message.warning('删除源失败, 错误信息: ' + err)
      })
    },
    listUpdatedEvent () {
      sites.clear().then(res1 => {
        // 重新排序
        var id = 1
        this.sites.forEach(element => {
          element.id = id
          sites.add(element)
          id += 1
        })
      })
    },
    checkSiteKey (e) {
      if (this.dialogType === 'edit' && this.editeOldkey === this.siteInfo.key) {
        return true
      } else {
        for (const i of this.sites) {
          if (i.key === this.siteInfo.key) {
            this.$message.warning(`源站标识: ${i.key} 已存在, 请勿重复填写.`)
            return false
          }
        }
        return true
      }
    },
    addOrEditSite () {
      if (!this.siteInfo.name || !this.siteInfo.api) {
        this.$message.error('名称和API接口不能为空。')
        return false
      }
      if (!this.checkSiteKey()) {
        return false
      }
      var randomstring = require('randomstring')
      var doc = {
        key: this.dialogType === 'edit' ? this.siteInfo.key : this.siteInfo.key ? this.siteInfo.key : randomstring.generate(6),
        id: this.dialogType === 'edit' ? this.siteInfo.id : this.sites[this.sites.length - 1].id + 1,
        name: this.siteInfo.name,
        api: this.siteInfo.api,
        download: this.siteInfo.download,
        group: this.siteInfo.group,
        isActive: this.siteInfo.isActive
      }
      if (this.dialogType === 'edit') sites.remove(this.siteInfo.id)
      sites.add(doc).then(res => {
        this.siteInfo = {
          key: '',
          name: '',
          api: '',
          download: '',
          group: ''
        }
        this.dialogType === 'edit' ? this.$message.success('修改成功！') : this.$message.success('新增源成功！')
        this.dialogVisible = false
        this.getSites()
      })
      this.editeOldkey = ''
    },
    exportSites () {
      this.getSites()
      const arr = [...this.sites]
      const str = JSON.stringify(arr, null, 2)
      const options = {
        filters: [
          { name: 'JSON file', extensions: ['json'] },
          { name: 'Normal text file', extensions: ['txt'] },
          { name: 'All types', extensions: ['*'] }
        ]
      }
      remote.dialog.showSaveDialog(options).then(result => {
        if (!result.canceled) {
          fs.writeFileSync(result.filePath, str)
          this.$message.success('已保存成功')
        }
      }).catch(err => {
        this.$message.error(err)
      })
    },
    importSites () {
      const options = {
        filters: [
          { name: 'JSON file', extensions: ['json'] },
          { name: 'Normal text file', extensions: ['txt'] },
          { name: 'All types', extensions: ['*'] }
        ],
        properties: ['openFile', 'multiSelections']
      }
      remote.dialog.showOpenDialog(options).then(result => {
        if (!result.canceled) {
          result.filePaths.forEach(file => {
            var str = fs.readFileSync(file)
            const json = JSON.parse(str)
            json.forEach(ele => {
              if (ele.api && this.sites.filter(x => x.key === ele.key).length === 0 && this.sites.filter(x => x.name === ele.name && x.api === ele.api).length === 0) {
                // 不含该key 同时也不含名字和url一样的
                if (ele.isActive === undefined) {
                  ele.isActive = 1
                }
                if (ele.group === undefined) {
                  ele.group = '导入'
                }
                this.sites.push(ele)
              }
            })
            this.resetId(this.sites)
            sites.clear().then(sites.bulkAdd(this.sites))
            this.$message.success('导入成功')
            this.getSites()
          })
        }
      })
    },
    resetSitesEvent () {
      sites.clear().then(sites.bulkAdd(defaultSites).then(this.getSites()))
      this.$message.success('重置源成功')
    },
    moveToTopEvent (i) {
      if (this.checkAllSiteLoading) {
        this.$message.info('正在检测, 请勿操作.')
        return false
      }
      this.sites.sort(function (x, y) { return x.key === i.key ? -1 : y.key === i.key ? 1 : 0 })
      this.updateDatabase()
    },
    syncTableData () {
      if (this.$refs.editSitesTable.tableData && this.$refs.editSitesTable.tableData.length === this.sites.length) {
        this.sites = this.$refs.editSitesTable.tableData
      }
    },
    isActiveChangeEvent (row) {
      this.updateDatabase()
    },
    resetId (inArray) {
      var id = 1
      inArray.forEach(ele => {
        ele.id = id
        id += 1
      })
    },
    updateDatabase () {
      // 因为el-table的数据是单向绑定,我们先同步el-table里的数据和其绑定的数据
      this.syncTableData()
      sites.clear().then(res => {
        var id = 1
        this.sites.forEach(ele => {
          ele.id = id
          id += 1
        })
        sites.bulkAdd(this.sites).then(this.getSites())
      })
    },
    removeAllSites () {
      sites.clear().then(this.getSites())
    },
    rowDrop () {
      const tbody = document.getElementById('sites-table').querySelector('.el-table__body-wrapper tbody')
      var _this = this
      Sortable.create(tbody, {
        onEnd ({ newIndex, oldIndex }) {
          const currRow = _this.sites.splice(oldIndex, 1)[0]
          _this.sites.splice(newIndex, 0, currRow)
          _this.updateDatabase()
        }
      })
    },
    async checkAllSite () {
      this.checkAllSiteLoading = true
      for (const i of this.sites) {
        i.status = ''
        this.tableKey = Math.random()
        const flag = await zy.check(i.key)
        if (flag) {
          i.status = '可用'
        } else {
          i.status = '失效'
          i.isActive = 0
        }
        this.tableKey = Math.random()
      }
      this.checkAllSiteLoading = false
      this.updateDatabase()
    },
    async checkSimpleSite (row) {
      this.checkAllSiteLoading = true
      const flag = await zy.check(row.key)
      if (flag) {
        row.status = '可用'
      } else {
        row.status = '失效'
        row.isActive = 0
      }
      this.updateDatabase()
      this.tableKey = Math.random()
      this.checkAllSiteLoading = false
    }
  },
  mounted () {
    this.rowDrop()
    this.checkAllSiteLoading = false
  },
  created () {
    this.getSites()
  }
}
</script>
