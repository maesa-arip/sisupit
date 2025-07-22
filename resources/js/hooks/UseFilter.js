import { router } from '@inertiajs/react';
import pkg from 'lodash';
import { useCallback, useEffect, useRef } from 'react';

export default function UseFilter({ route, values, only, wait = 300 }) {
	const { debounce, pickBy, isEqual } = pkg;
	const previousValues = useRef(values);
	
	const reload = useCallback(
		debounce((query) => {
			router.get(route, pickBy(query), {
				only: only,
				preserveScroll: true,
				preserveState: true,
			});
		}, wait),
		[route, only, wait],
	);
	
	useEffect(() => {
		// Only reload if values have actually changed
		if (!isEqual(previousValues.current, values)) {
			previousValues.current = values;
			reload(values);
		}
	}, [values, reload]);
	
	return { values };
}