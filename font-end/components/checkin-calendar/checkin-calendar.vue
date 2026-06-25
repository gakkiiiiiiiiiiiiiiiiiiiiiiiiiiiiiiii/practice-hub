<template>
	<view class="checkin-calendar">
		<view class="calendar-header" @click="showModal">
			<view class="header-left">
				<app-icon name="calendar" :size="32" color="#17c3a2" />
				<text class="calendar-title">打卡日历</text>
			</view>
			<view class="header-right">
				<view class="calendar-stats">
					<text class="stats-text">本月打卡 {{ currentMonthCheckins }} 天</text>
				</view>
				<view class="open-calendar-btn" @click.stop="showModal">
					<text class="open-calendar-text">打开日历</text>
					<app-icon name="arrow-right" :size="24" color="#17c3a2" class="expand-icon" />
				</view>
			</view>
		</view>
	</view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { getCheckinList } from '@/api/index';
import AppIcon from '@/components/app-icon/app-icon.vue';

const props = defineProps({
	year: {
		type: Number,
		default: () => new Date().getFullYear(),
	},
	month: {
		type: Number,
		default: () => new Date().getMonth() + 1,
	},
});

const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
const checkinDates = ref([]); // 已打卡日期 YYYY-MM-DD
const loading = ref(false);

const parseCheckinListResponse = (res) => {
	if (Array.isArray(res?.list)) return res.list;
	if (Array.isArray(res?.data?.list)) return res.data.list;
	return [];
};

// 当前月份的天数
const daysInMonth = computed(() => {
	const date = new Date(props.year, props.month - 1, 1);
	const lastDay = new Date(props.year, props.month, 0);
	return lastDay.getDate();
});

// 当月第一天是星期几（0=周日，1=周一...）
const startDayOfWeek = computed(() => {
	const date = new Date(props.year, props.month - 1, 1);
	return date.getDay();
});

// 当前月份打卡天数
const currentMonthCheckins = computed(() => checkinDates.value.length);

// 判断是否是今天
const isToday = (day) => {
	const today = new Date();
	return (
		props.year === today.getFullYear() &&
		props.month === today.getMonth() + 1 &&
		day === today.getDate()
	);
};

// 判断是否已打卡
const isCheckedIn = (day) => {
	const dateStr = `${props.year}-${String(props.month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
	return checkinDates.value.includes(dateStr);
};

// 判断是否是过去
const isPast = (day) => {
	const today = new Date();
	const date = new Date(props.year, props.month - 1, day);
	return date < today && !isToday(day);
};

// 判断是否是未来
const isFuture = (day) => {
	const today = new Date();
	const date = new Date(props.year, props.month - 1, day);
	return date > today;
};

// 显示弹窗 - 通过事件通知父组件
const showModal = () => {
	uni.$emit('show-checkin-calendar', {
		checkinDates: [...checkinDates.value],
		currentMonthCheckins: currentMonthCheckins.value,
		year: props.year,
		month: props.month,
	});
};

// 点击日期
const handleDayClick = (day) => {
	if (isFuture(day)) {
		return;
	}
	// 可以在这里添加点击事件，比如显示打卡详情
};

// 获取打卡记录
const fetchCheckins = async () => {
	loading.value = true;
	try {
		const res = await getCheckinList({ page: 1, pageSize: 100 });
		const list = parseCheckinListResponse(res);
		const dates = [];
		list.forEach((checkin) => {
			if (!checkin?.checkinDate) return;
			let date;
			if (typeof checkin.checkinDate === 'string') {
				date = new Date(checkin.checkinDate);
			} else {
				date = new Date(checkin.checkinDate);
			}
			if (Number.isNaN(date.getTime())) {
				console.warn('无效的日期:', checkin.checkinDate);
				return;
			}
			if (date.getFullYear() === props.year && date.getMonth() + 1 === props.month) {
				dates.push(
					`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
				);
			}
		});
		checkinDates.value = dates;
	} catch (error) {
		console.error('获取打卡记录失败:', error);
	} finally {
		loading.value = false;
	}
};

onMounted(() => {
	fetchCheckins();
});
</script>

<style lang="scss" scoped>
@import '@/styles/design-system.scss';

.checkin-calendar {
	background: #fff;
	border-radius: $radius-lg;
	padding: 0;
	margin-bottom: $space-4;
	box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.08);
	overflow: visible;
	position: relative;
	z-index: $z-base;
}

/* 移除弹窗相关样式，弹窗已移到页面根节点 */

.calendar-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: $space-4 $space-6;
	cursor: pointer;
	transition: all $transition-fast;
	user-select: none;

	&:active {
		background: rgba(0, 0, 0, 0.02);
		transform: scale(0.98);
	}
}

.header-left {
	display: flex;
	align-items: center;
	gap: $space-3;
}

.header-right {
	display: flex;
	align-items: center;
	gap: $space-3;
}

.open-calendar-btn {
	display: flex;
	align-items: center;
	gap: $space-1;
	padding: $space-1 $space-2;
	border-radius: 999rpx;
	background: rgba($color-primary, 0.1);
}

.open-calendar-text {
	font-size: $font-size-xs;
	color: $color-primary;
	font-weight: $font-weight-medium;
}

.expand-icon {
	transition: transform $transition-fast;
}

.calendar-title {
	font-size: $font-size-lg;
	font-weight: $font-weight-semibold;
	color: $text-primary;
}

.calendar-stats {
	display: flex;
	align-items: center;
}

.stats-text {
	font-size: $font-size-sm;
	color: $color-primary;
	font-weight: $font-weight-medium;
}

@media screen and (min-width: 768px) {
	.checkin-calendar {
		border-radius: 16px;
		margin-bottom: 14px;
		box-shadow: 0 8px 24px rgba(26, 43, 77, 0.08);
	}

	.calendar-header {
		min-height: 66px;
		padding: 0 22px;
	}

	.header-left,
	.header-right {
		gap: 10px;
	}

	.calendar-title {
		font-size: 24px;
		line-height: 1.2;
		font-weight: 700;
		letter-spacing: 0;
	}

	.stats-text {
		font-size: 18px;
		line-height: 1.25;
		font-weight: 600;
	}
}

.night-mode {
	.checkin-calendar {
		background: #2a2a2a;
	}

	.calendar-header {
		&:active {
			background: rgba(255, 255, 255, 0.05);
		}
	}

	.calendar-title {
		color: #e0e0e0;
	}

	.stats-text {
		color: #17c3a2;
	}

	.open-calendar-btn {
		background: rgba(23, 195, 162, 0.15);
	}

	.open-calendar-text {
		color: #17c3a2;
	}

	.expand-icon {
		color: #999;
	}
}
</style>
