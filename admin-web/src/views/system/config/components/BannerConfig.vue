<template>
  <div class="banner-config">
    <a-button type="primary" @click="handleAdd" style="margin-bottom: 16px">
      <template #icon><plus-outlined /></template>
      添加轮播图
    </a-button>

    <a-list :data-source="banners" item-layout="horizontal">
      <template #renderItem="{ item, index }">
        <a-list-item>
          <template #actions>
            <a-button type="link" @click="handleEdit(item, index)">编辑</a-button>
            <a-popconfirm title="确定要删除吗？" @confirm="handleDelete(index)">
              <a-button type="link" danger>删除</a-button>
            </a-popconfirm>
          </template>
          <a-list-item-meta>
            <template #avatar>
              <a-image :src="item.image" :width="100" :height="60" />
            </template>
            <template #title>
              <a :href="item.link" target="_blank">{{ item.link }}</a>
            </template>
          </a-list-item-meta>
        </a-list-item>
      </template>
    </a-list>

    <a-modal
      v-model:open="modalVisible"
      :title="currentIndex !== null ? '编辑轮播图' : '添加轮播图'"
      @ok="handleSubmit"
    >
      <a-form :model="formState" :label-col="{ span: 6 }" :wrapper-col="{ span: 18 }">
        <a-form-item label="图片">
          <a-upload
            v-model:file-list="fileList"
            :before-upload="beforeUpload"
            list-type="picture-card"
            :max-count="1"
          >
            <div v-if="fileList.length < 1">
              <plus-outlined />
              <div style="margin-top: 8px">上传</div>
            </div>
          </a-upload>
        </a-form-item>
        <a-form-item label="跳转链接">
          <a-input v-model:value="formState.link" placeholder="请输入链接" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { PlusOutlined } from '@ant-design/icons-vue'
import { getSystemConfig, updateSystemConfig } from '@/api/system'

const banners = ref<any[]>([])
const modalVisible = ref(false)
const currentIndex = ref<number | null>(null)
const fileList = ref<any[]>([])

const formState = ref({
  image: '',
  link: '',
})

const fetchConfig = async () => {
  try {
    const res = await getSystemConfig()
    banners.value = res.data.banners || []
  } catch (error) {
    console.error('获取配置失败:', error)
  }
}

const beforeUpload = (file: File) => {
  const isImage = file.type.startsWith('image/')
  if (!isImage) {
    message.error('只能上传图片文件!')
    return false
  }
  formState.value.image = URL.createObjectURL(file)
  return false
}

const handleAdd = () => {
  currentIndex.value = null
  formState.value = { image: '', link: '' }
  fileList.value = []
  modalVisible.value = true
}

const handleEdit = (item: any, index: number) => {
  currentIndex.value = index
  formState.value = { ...item }
  if (item.image) {
    fileList.value = [
      {
        uid: '-1',
        name: 'banner.png',
        status: 'done',
        url: item.image,
      },
    ]
  }
  modalVisible.value = true
}

const handleDelete = async (index: number) => {
  banners.value.splice(index, 1)
  await updateSystemConfig({ banners: banners.value })
  message.success('删除成功')
}

const handleSubmit = async () => {
  if (!formState.value.image || !formState.value.link) {
    message.error('请填写完整信息')
    return
  }

  if (currentIndex.value !== null) {
    banners.value[currentIndex.value] = { ...formState.value }
  } else {
    banners.value.push({ ...formState.value })
  }

  await updateSystemConfig({ banners: banners.value })
  message.success('保存成功')
  modalVisible.value = false
}

onMounted(() => {
  fetchConfig()
})
</script>

