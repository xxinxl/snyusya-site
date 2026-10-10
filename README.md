# Фан-клуб Снюси

Интерактивный сайт о Снюсе: фотографии, поглаживания, мурчание, лазер и мини-игра.

Сайт: https://xxinxl.github.io/snyusya-site/

## Разработка

```powershell
pnpm install --frozen-lockfile
pnpm dev
```

## Публикация

GitHub Pages публикует готовую сборку из папки `docs` ветки `codex/snyusya-pages`.
После изменения исходников обновите сборку и отправьте изменения в эту ветку:

```powershell
pnpm build
Copy-Item -Path 'dist\*' -Destination 'docs' -Recurse -Force
git add src public docs
git commit -m "Update Snyusya site"
git push
```

Пути к фотографиям и ресурсам учитывают размещение сайта в подпапке GitHub Pages.
