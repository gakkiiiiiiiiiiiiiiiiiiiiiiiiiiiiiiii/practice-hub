<template>
  <a-modal
    :open="open"
    :title="record ? '编辑科目' : '新增科目'"
    @cancel="handleCancel"
    @ok="handleSubmit"
    :confirmLoading="loading"
    width="600px"
  >
    <a-form
      ref="formRef"
      :model="formState"
      :rules="rules"
      :label-col="{ span: 6 }"
      :wrapper-col="{ span: 18 }"
    >
      <a-form-item label="科目名称" name="name">
        <a-input v-model:value="formState.name" placeholder="请输入科目名称" />
      </a-form-item>
      <a-form-item label="封面图" name="cover_img">
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
      <a-form-item label="价格" name="price">
        <a-input-number
          v-model:value="formState.price"
          :min="0"
          :precision="2"
          style="width: 100%"
          placeholder="请输入价格"
        />
      </a-form-item>
      <a-form-item label="VIP免费" name="is_vip_free">
        <a-radio-group v-model:value="formState.is_vip_free">
          <a-radio :value="0">否</a-radio>
          <a-radio :value="1">是</a-radio>
        </a-radio-group>
      </a-form-item>
      <a-form-item label="排序" name="sort">
        <a-input-number
          v-model:value="formState.sort"
          :min="0"
          style="width: 100%"
          placeholder="请输入排序值（数字越小越靠前）"
        />
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { message } from 'ant-design-vue'
import { PlusOutlined } from '@ant-design/icons-vue'
import { createSubject, updateSubject } from '@/api/question'
import type { UploadProps } from 'ant-design-vue'

const props = defineProps<{
  open: boolean
  record: any
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'success'): void
}>()

const formRef = ref()
const loading = ref(false)
const fileList = ref<any[]>([])

const formState = ref({
  name: '',
  cover_img: '',
  price: 0,
  is_vip_free: 0,
  sort: 0,
})

const rules = {
  name: [{ required: true, message: '请输入科目名称', trigger: 'blur' }],
  price: [{ required: true, message: '请输入价格', trigger: 'blur' }],
}

watch(
  () => props.open,
  (val) => {
    if (val) {
      if (props.record) {
        // 映射后端字段到前端表单
        formState.value = {
          name: props.record.name || '',
          cover_img: props.record.cover_img || props.record.cover || '',
          price: props.record.price || 0,
          is_vip_free: props.record.is_vip_free ?? 0,
          sort: props.record.sort || 0,
        }
        if (formState.value.cover_img) {
          fileList.value = [
            {
              uid: '-1',
              name: 'cover.png',
              status: 'done',
              url: formState.value.cover_img,
            },
          ]
        } else {
          fileList.value = []
        }
      } else {
        formState.value = {
          name: '',
          cover_img: '',
          price: 0,
          is_vip_free: 0,
          sort: 0,
        }
        fileList.value = []
      }
    }
  }
)

const beforeUpload: UploadProps['beforeUpload'] = (file) => {
  const isImage = file.type.startsWith('image/')
  if (!isImage) {
    message.error('只能上传图片文件!')
    return false
  }
  const isLt2M = file.size / 1024 / 1024 < 2
  if (!isLt2M) {
    message.error('图片大小不能超过 2MB!')
    return false
  }
  // TODO: 实际上传逻辑，上传后获取真实 URL
  // 暂时使用 blob URL
  formState.value.cover_img = URL.createObjectURL(file)
  return false
}

const handleCancel = () => {
  emit('update:open', false)
  formRef.value?.resetFields()
}

const handleSubmit = async () => {
  try {
    await formRef.value?.validate()
    loading.value = true

    // 构建符合后端 DTO 的数据
    const submitData: any = {
      name: formState.value.name,
    }

    // 只添加有值的字段
    if (formState.value.cover_img) {
      submitData.cover_img = formState.value.cover_img
    }
    if (formState.value.price !== undefined && formState.value.price !== null) {
      submitData.price = formState.value.price
    }
    if (formState.value.is_vip_free !== undefined) {
      submitData.is_vip_free = formState.value.is_vip_free
    }
    if (formState.value.sort !== undefined) {
      submitData.sort = formState.value.sort
    }

    if (props.record) {
      await updateSubject(props.record.id, submitData)
      message.success('更新成功')
    } else {
      await createSubject(submitData)
      message.success('创建成功')
    }

    emit('success')
    emit('update:open', false)
  } catch (error: any) {
    if (error?.errorFields) {
      return
    }
    message.error(error?.message || '操作失败')
  } finally {
    loading.value = false
  }
}
</script>

