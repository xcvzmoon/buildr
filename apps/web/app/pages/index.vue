<script setup lang="ts">
  definePageMeta({ middleware: 'auth' });

  await navigateTo('/overview');
</script>

<template />
