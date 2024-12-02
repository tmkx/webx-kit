<script lang="ts">
  import logo from '@/assets/text-logo.svg';
  import Hello from './hello.svelte';

  let count = 0;

  function handleClick() {
    count += 1;
  }
</script>

<div class="fixed z-10 right-16 bottom-16 text-base flex-center flex-col bg-slate-200 px-6 py-4 rounded-xl">
  <img class="h-5" src={logo} alt="Logo" />
  <div>
    <span class="text-slate-700 dark:text-slate-400">Count: </span>
    <button class="text-sky-700 tabular-nums" on:click={handleClick}>
      {count}
    </button>
  </div>
  <Hello />
</div>
