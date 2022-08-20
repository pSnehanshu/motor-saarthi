<script lang="ts">
	import type { PageData } from './$types';
	import {
		ContactReasons,
		ContactReasonsHumanFriendly
	} from '../../../../../shared/contact-reasons';
	import trpc from '../../../trpc';

	export let data: PageData;
	const qr = data;

	const userName = qr?.Vehicle?.OwnerCustomer?.User?.name ?? 'N/A';

	const ContactReasonsEntries = Object.entries(ContactReasonsHumanFriendly) as [
		ContactReasons,
		string
	][];

	let selectedReason: ContactReasons | null = null;
	function setSelectedReason(reason: ContactReasons) {
		if (selectedReason === reason) {
			selectedReason = null;
		} else {
			selectedReason = reason;
		}
	}

	let sending = false;
	let successContact = false;
	let errorContact = '';

	async function submitContact() {
		if (!selectedReason) return;

		try {
			errorContact = '';
			sending = true;

			await trpc.mutation('stranger.contact', {
				qrId: qr.id,
				reason: selectedReason
			});

			successContact = true;
			selectedReason = null;
		} catch (error) {
			console.error(error);
			errorContact = 'Failed to send message! Please try again.';
		}
		sending = false;
	}

	function dateFormat(date: any) {
		return new Intl.DateTimeFormat('en-IN', {
			dateStyle: 'long'
		}).format(new Date(date));
	}
</script>

<div>
	{#if successContact}
		<div class="alert alert-success" role="alert">
			Your message have been sent to
			{userName}. Thanks for using our services.
		</div>

		<button class="btn btn-link" on:click={() => (successContact = false)}>Send again</button>
	{:else}
		<table class="table">
			<tbody>
				<tr>
					<th>Name of owner</th>
					<td>{userName}</td>
				</tr>
				<tr>
					<th>Registration number</th>
					<td>{qr?.Vehicle?.registration_num ?? '-'}</td>
				</tr>
				<tr>
					<th>Member since</th>
					<td>{dateFormat(qr?.Vehicle?.OwnerCustomer?.User?.created_at)}</td>
				</tr>
			</tbody>
		</table>

		<ul class="row" style="user-select: none; list-style-type: none">
			{#each ContactReasonsEntries as [reason, description]}
				<li role="option" class="reason col col-5 border rounded m-1 p-0 overflow-hidden">
					<button
						on:click={() => setSelectedReason(reason)}
						type="button"
						class="w-100 h-100 text-center border-0"
						class:selected-reason={reason === selectedReason}
					>
						{description}
					</button>
				</li>
			{/each}
		</ul>

		{#if errorContact}
			<div class="alert alert-danger" role="alert">{errorContact}</div>
		{/if}

		<button
			type="submit"
			style="height: 3em"
			class="btn btn-primary w-100"
			disabled={!selectedReason || sending}
			on:click={submitContact}
		>
			{#if sending}
				<div class="spinner-border text-light" role="status">
					<span class="sr-only" />
				</div>
			{:else}
				Send message to {userName}
			{/if}
		</button>
	{/if}
</div>

<style>
	.reason {
		height: 200px;
		cursor: pointer;
	}
	.selected-reason {
		background-color: green;
		color: white;
	}
</style>
