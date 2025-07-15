<script lang="ts">
  import { onMount } from 'svelte';
  import * as e2e from '$lib/tele/e2e.telephone';

  let greeting = '';
  let sum = 0;
  let errorMessage = '';
  let noArgsResult = '';
  let optionalArgResult = '';

  onMount(async () => {
    try {
      greeting = await e2e.hello('E2E Test');
      sum = await e2e.add(2, 3);
      noArgsResult = await e2e.functionWithNoArgs();
      optionalArgResult = await e2e.functionWithOptionalArg();
      await e2e.errorFunction(); // This will throw an error
    } catch (err: any) {
      errorMessage = err.message;
    }
  });
</script>

<h1>SvelteKit Test App</h1>
<p data-testid="greeting">{greeting}</p>
<p data-testid="sum">{sum}</p>
<p data-testid="noArgsResult">{noArgsResult}</p>
<p data-testid="optionalArgResult">{optionalArgResult}</p>
<p data-testid="errorMessage">{errorMessage}</p>
