<template>
	<view class="agreement-page">
		<view class="agreement-card">
			<text class="agreement-title">{{ pageTitle }}</text>
			<text class="agreement-date">生效日期：2026年5月1日</text>

			<template v-if="type === 'privacy'">
				<view class="section">
					<text class="section-title">一、我们收集的信息</text>
					<text class="section-text">为向您提供课程浏览、购买、文件预览、刷题、收藏、错题、笔记、学习轨迹、打卡和售后服务，我们可能在您授权或主动使用相关功能时收集以下信息：微信 OpenID、昵称、头像、手机号、订单信息、课程学习记录、答题记录、收藏记录、错题记录、笔记内容、打卡记录、设备基础信息和必要的日志信息。</text>
				</view>
				<view class="section">
					<text class="section-title">二、信息使用目的</text>
					<text class="section-text">上述信息将用于账号识别与登录、展示个人资料、保存学习进度、生成错题和收藏、完成课程购买与售后、保障账号与交易安全、优化产品体验及处理用户反馈。我们不会将个人信息用于与本小程序服务无关的用途。</text>
				</view>
				<view class="section">
					<text class="section-title">三、授权与最小必要原则</text>
					<text class="section-text">您可以先浏览首页、课程列表和课程介绍等基础内容。只有当您主动点击登录、购买、收藏、笔记、错题、打卡、个人资料等需要账号能力的功能时，我们才会请求相应授权。未经您授权同意，我们不会强制获取手机号、头像或昵称。</text>
				</view>
				<view class="section">
					<text class="section-title">四、信息存储与保护</text>
					<text class="section-text">我们会采取合理的安全措施保护您的个人信息，包括访问控制、传输保护和服务端权限校验。除法律法规要求、履行服务所必需或取得您授权外，我们不会向无关第三方共享、转让或公开披露您的个人信息。</text>
				</view>
				<view class="section">
					<text class="section-title">五、您的权利</text>
					<text class="section-text">您可以在小程序内查看或修改个人资料、清除本地缓存、退出登录。如需查询、更正或删除服务端个人信息，或撤回授权、注销账号，可以通过“功能反馈”或客服渠道联系我们处理。</text>
				</view>
			</template>

			<template v-else>
				<view class="section">
					<text class="section-title">一、服务说明</text>
					<text class="section-text">本小程序为用户提供考研课程浏览、题库练习、文件课程预览、学习记录、订单购买、激活码兑换和售后反馈等服务。您使用本服务前，应阅读并同意本协议及《隐私政策》。</text>
				</view>
				<view class="section">
					<text class="section-title">二、账号与授权</text>
					<text class="section-text">您可以在未登录状态下浏览部分内容。使用购买、答题记录、收藏、错题、笔记、打卡、个人资料等功能时，需要进行微信授权登录或手机号授权。您应保证授权信息真实、有效，并妥善保管账号信息。</text>
				</view>
				<view class="section">
					<text class="section-title">三、付费与课程使用</text>
					<text class="section-text">部分课程为付费课程。购买成功或激活成功后，您可在有效期内使用对应课程服务。文件类课程可能仅支持小程序内预览，是否允许查看源文件以课程配置为准。</text>
				</view>
				<view class="section">
					<text class="section-title">四、用户行为规范</text>
					<text class="section-text">您不得利用本小程序从事违法违规行为，不得恶意攻击系统、盗用他人账号、传播侵权内容、批量抓取课程资料或以任何方式破坏平台正常运行。</text>
				</view>
				<view class="section">
					<text class="section-title">五、协议更新与联系</text>
					<text class="section-text">我们可能根据服务变化或法律法规要求更新本协议，并在小程序内展示。若您对协议或服务有疑问，可通过“功能反馈”联系我们。</text>
				</view>
			</template>
		</view>
	</view>
</template>

<script setup>
import { computed, ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';

const type = ref('privacy');

const pageTitle = computed(() => (type.value === 'privacy' ? '隐私政策' : '用户服务协议'));

onLoad((options) => {
	type.value = options?.type === 'terms' ? 'terms' : 'privacy';
	uni.setNavigationBarTitle({
		title: pageTitle.value,
	});
});
</script>

<style lang="scss" scoped>
@import '@/styles/design-system.scss';

.agreement-page {
	min-height: 100vh;
	background: $bg-secondary;
	padding: $space-6;
	box-sizing: border-box;
}

.agreement-card {
	background: $bg-primary;
	border-radius: $radius-xl;
	padding: $space-8;
	box-shadow: $shadow-sm;
}

.agreement-title {
	display: block;
	font-size: $font-size-xl;
	font-weight: $font-weight-bold;
	color: $text-primary;
	margin-bottom: $space-3;
}

.agreement-date {
	display: block;
	font-size: $font-size-sm;
	color: $text-tertiary;
	margin-bottom: $space-8;
}

.section {
	margin-bottom: $space-8;
}

.section-title {
	display: block;
	font-size: $font-size-md;
	font-weight: $font-weight-semibold;
	color: $text-primary;
	margin-bottom: $space-3;
}

.section-text {
	display: block;
	font-size: $font-size-base;
	line-height: $line-height-relaxed;
	color: $text-secondary;
	text-align: justify;
}
</style>
