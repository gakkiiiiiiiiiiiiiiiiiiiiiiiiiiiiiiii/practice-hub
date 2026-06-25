import { computed } from 'vue';
import { useBankStore } from '@/store/bank';
import { useDeviceStore } from '@/store/device';

export function usePageClasses() {
	const bankStore = useBankStore();
	const deviceStore = useDeviceStore();

	return computed(() => {
		const classes = [];
		if (bankStore.settings.nightMode) {
			classes.push('night-mode');
		}
		if (bankStore.settings.fontSize) {
			classes.push(`font-size-${bankStore.settings.fontSize}`);
		}
		if (deviceStore.isPadCompact) {
			classes.push('is-pad-compact');
		}
		return classes.join(' ');
	});
}
