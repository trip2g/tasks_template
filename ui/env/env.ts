namespace $ {

	export type $trip2gtasks_env_config = {
		path: string
		title: string
		editable: boolean
		meta: Record<string, unknown>
	}

	type $trip2gtasks_env_host = {
		__trip2gtasks?: $trip2gtasks_env_config
		__trip2g_settings?: { ui_lang?: string }
		location?: Location
	}

	function host() {
		try {
			return (globalThis.parent ?? globalThis) as unknown as $trip2gtasks_env_host
		} catch {
			return globalThis as unknown as $trip2gtasks_env_host
		}
	}

	export function $trip2gtasks_env_config(): $trip2gtasks_env_config {
		return host().__trip2gtasks ?? { path: '', title: '', editable: false, meta: {} }
	}

	export function $trip2gtasks_env_url(permalink: string) {
		return new URL(permalink, host().location?.href ?? $mol_dom_context.location.href).href
	}

	export function $trip2gtasks_env_lang() {
		return host().__trip2g_settings?.ui_lang || $mol_dom_context.navigator.language.replace(/-.*/, '') || 'en'
	}

	export function $trip2gtasks_env_today() {
		const now = new Date()
		const month = String(now.getMonth() + 1).padStart(2, '0')
		const day = String(now.getDate()).padStart(2, '0')
		return `${now.getFullYear()}-${month}-${day}`
	}

	export function $trip2gtasks_env_days_between(from: string, to: string) {
		return Math.round((Date.parse(to) - Date.parse(from)) / 86_400_000)
	}

	$mol_locale.lang = () => $trip2gtasks_env_lang()

}
