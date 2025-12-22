import request from '@/utils/request'

// 科目管理
export function getSubjectList(params?: any) {
  return request.get('/admin/subjects', { params })
}

export function createSubject(data: any) {
  return request.post('/admin/subjects', data)
}

export function updateSubject(id: number, data: any) {
  return request.put(`/admin/subjects/${id}`, data)
}

export function deleteSubject(id: number) {
  return request.delete(`/admin/subjects/${id}`)
}

export function updateSubjectStatus(id: number, data: any) {
  return request.patch(`/admin/subjects/${id}/status`, data)
}

// 章节管理（需要根据实际 API 文档调整，可能包含在科目详情中）
export function getChapterList(params: any) {
  return request.get('/admin/chapters', { params })
}

export function createChapter(data: any) {
  return request.post('/admin/chapters', data)
}

export function updateChapter(id: number, data: any) {
  return request.put(`/admin/chapters/${id}`, data)
}

export function deleteChapter(id: number) {
  return request.delete(`/admin/chapters/${id}`)
}

// 试题管理
export function getQuestionList(params?: any) {
  return request.get('/admin/questions', { params })
}

export function getQuestionDetail(id: number) {
  return request.get(`/admin/questions/${id}`)
}

export function createQuestion(data: any) {
  return request.post('/admin/questions', data)
}

export function updateQuestion(id: number, data: any) {
  return request.put(`/admin/questions/${id}`, data)
}

export function deleteQuestion(id: number) {
  return request.delete(`/admin/questions/${id}`)
}

// 批量导入
export function importQuestions(data: FormData) {
  return request.post('/admin/questions/import', data, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
}

export function downloadQuestionTemplate() {
  return request.get('/admin/questions/template', {
    responseType: 'blob',
  })
}

// 上传图片（需要根据实际 API 文档调整）
export function uploadImage(data: FormData) {
  return request.post('/admin/upload/image', data, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
}

