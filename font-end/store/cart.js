/**
 * 购物车状态（本地持久化，仅支持付费课程）
 */
import { defineStore } from 'pinia'

const STORAGE_KEY = 'practice_cart_items'

const readStorage = () => {
  try {
    const raw = uni.getStorageSync(STORAGE_KEY)
    return Array.isArray(raw) ? raw : []
  } catch {
    return []
  }
}

const writeStorage = (items) => {
  uni.setStorageSync(STORAGE_KEY, items)
}

export const useCartStore = defineStore('cart', {
  state: () => ({
    items: readStorage(),
    selectedIds: readStorage().map((item) => item.courseId),
  }),

  getters: {
    count: (state) => state.items.length,
    selectedItems: (state) => state.items.filter((item) => state.selectedIds.includes(item.courseId)),
    selectedCount: (state) => state.selectedIds.length,
    selectedTotal: (state) =>
      state.items
        .filter((item) => state.selectedIds.includes(item.courseId))
        .reduce((sum, item) => sum + Number(item.price || 0), 0),
    hasCourse: (state) => (courseId) => state.items.some((item) => item.courseId === courseId),
  },

  actions: {
    persist() {
      writeStorage(this.items)
    },

    syncSelectedIds() {
      const validIds = new Set(this.items.map((item) => item.courseId))
      this.selectedIds = this.selectedIds.filter((id) => validIds.has(id))
      if (this.selectedIds.length === 0 && this.items.length > 0) {
        this.selectedIds = this.items.map((item) => item.courseId)
      }
    },

    addCourse(course) {
      if (!course?.id) return false
      if (this.hasCourse(course.id)) {
        return false
      }
      this.items.unshift({
        courseId: course.id,
        name: course.name || '课程',
        coverImg: course.cover_img || course.coverImg || '',
        price: Number(course.price || 0),
        contentType: course.content_type || course.contentType || 'normal',
        addedAt: Date.now(),
      })
      this.selectedIds = [...new Set([course.id, ...this.selectedIds])]
      this.persist()
      return true
    },

    removeCourse(courseId) {
      this.items = this.items.filter((item) => item.courseId !== courseId)
      this.selectedIds = this.selectedIds.filter((id) => id !== courseId)
      this.persist()
    },

    removeCourses(courseIds = []) {
      const idSet = new Set(courseIds)
      this.items = this.items.filter((item) => !idSet.has(item.courseId))
      this.selectedIds = this.selectedIds.filter((id) => !idSet.has(id))
      this.persist()
    },

    toggleSelect(courseId) {
      if (this.selectedIds.includes(courseId)) {
        this.selectedIds = this.selectedIds.filter((id) => id !== courseId)
      } else {
        this.selectedIds = [...this.selectedIds, courseId]
      }
    },

    selectAll() {
      this.selectedIds = this.items.map((item) => item.courseId)
    },

    clearSelection() {
      this.selectedIds = []
    },

    isSelected(courseId) {
      return this.selectedIds.includes(courseId)
    },

    clearCart() {
      this.items = []
      this.selectedIds = []
      this.persist()
    },
  },
})
