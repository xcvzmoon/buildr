<script setup lang="ts">
  const { session, signOut } = await useAuth();
</script>

<template>
  <div class="min-h-screen">
    <header class="flex items-center justify-between border-b border-default px-6 py-4">
      <span class="text-sm font-semibold tracking-tight">Buildr</span>

      <div
        v-if="session"
        class="flex items-center gap-3"
      >
        <span class="text-sm text-muted">{{ session.user.name }}</span>
        <UButton
          label="Sign out"
          color="neutral"
          variant="subtle"
          size="sm"
          @click="signOut"
        />
      </div>
    </header>

    <main class="p-6">
      <NuxtPage />
    </main>
  </div>
</template>
