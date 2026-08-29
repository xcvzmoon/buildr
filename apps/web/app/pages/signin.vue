<script setup lang="ts">
  import type { SubmitHandler } from '@formisch/vue';
  import { Field, Form, useForm } from '@formisch/vue';
  import * as v from 'valibot';

  definePageMeta({ middleware: 'guest' });

  const route = useRoute();
  const redirectTarget = computed(() =>
    v.parse(redirectPathSchema('/overview'), route.query.redirect),
  );

  const signinForm = useForm({ schema: signinSchema });
  const signInEmail = useSignIn('email');
  const signInSocial = useSignIn('social');

  const onSubmit: SubmitHandler<typeof signinSchema> = async (output) => {
    await signInEmail.execute(
      {
        email: output.email,
        password: output.password,
      },
      {
        onSuccess: async () => {
          await refreshNuxtData(SESSION_CACHE_KEY);
          await navigateTo(redirectTarget.value);
        },
      },
    );
  };

  async function onGoogleSignIn(): Promise<void> {
    await signInSocial.execute({
      provider: 'google',
      callbackURL: `${useRequestURL().origin}${redirectTarget.value}`,
    });
  }
</script>

<template>
  <div class="flex min-h-screen items-center justify-center px-4">
    <SpecPanel code="AUTH/SIGNIN">
      <div class="mb-6 space-y-2 text-center">
        <div class="mx-auto flex size-10 items-center justify-center border border-default">
          <UIcon
            name="i-lucide-lock"
            class="size-5"
          />
        </div>
        <h1 class="text-lg font-semibold tracking-tight">Welcome back</h1>
        <p class="text-sm text-muted">Sign in to your account to continue</p>
      </div>

      <UButton
        label="Continue with Google"
        icon="i-hugeicons-google"
        color="neutral"
        block
        :loading="signInSocial.status.value === 'pending'"
        @click="onGoogleSignIn"
      />

      <USeparator
        label="or"
        class="my-4"
      />

      <Form
        :of="signinForm"
        class="space-y-4"
        @submit="onSubmit"
      >
        <Field
          v-slot="field"
          :of="signinForm"
          :path="['email']"
        >
          <UFormField
            label="Email"
            required
            :error="field.errors?.[0]"
          >
            <UInput
              v-model="field.input"
              v-bind="field.props"
              type="email"
              placeholder="you@example.com"
              class="w-full"
            />
          </UFormField>
        </Field>

        <Field
          v-slot="field"
          :of="signinForm"
          :path="['password']"
        >
          <UFormField
            label="Password"
            required
            :error="field.errors?.[0]"
          >
            <template #hint>
              <ULink
                to="/forgot-password"
                class="text-xs"
              >
                Forgot password?
              </ULink>
            </template>

            <UInput
              v-model="field.input"
              v-bind="field.props"
              type="password"
              class="w-full"
            />
          </UFormField>
        </Field>

        <UAlert
          v-if="signInEmail.error.value"
          color="error"
          variant="subtle"
          :title="signInEmail.error.value.message"
        />

        <UButton
          type="submit"
          label="Sign in"
          color="neutral"
          block
          :loading="signinForm.isSubmitting || signInEmail.status.value === 'pending'"
        />
      </Form>

      <p class="mt-6 text-center text-sm text-muted">
        Don't have an account?
        <ULink to="/signup">Sign up</ULink>
      </p>
    </SpecPanel>
  </div>
</template>
