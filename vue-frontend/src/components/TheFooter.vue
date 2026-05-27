<template>
  <footer class="footer">
    <p class="copyright">&copy; Copy Right</p>
  </footer>
</template>

<style scoped>
.footer {
  background: linear-gradient(135deg, #483c32 0%, #5a4a3e 100%);
  padding: var(--p-4, 0.5rem) 0;
  text-align: center;
  margin-top: auto;
  box-shadow: 0 -2px 8px rgba(72, 60, 50, 0.1);
}

.copyright {
  color: #ffffff;
  font-size: 0.9rem;
  margin: 0;
  opacity: 0.9;
}

@media print {
  .footer {
    display: none !important;
  }
}
</style>
