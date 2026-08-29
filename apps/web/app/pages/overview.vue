<script setup lang="ts">
  definePageMeta({ middleware: 'auth', layout: 'authenticated' });

  const { session } = await useAuth();
</script>

<template>
  <div
    v-if="session"
    class="space-y-1"
  >
    <h1 class="text-lg font-semibold">Overview</h1>
    <p class="text-sm text-muted">Signed in as {{ session.user.email }}</p>
  </div>
</template>
