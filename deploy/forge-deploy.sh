# AOFORUM — Laravel Forge deploy script.
# Paste this into your Forge site's "Deploy Script" box. Forge provides the
# $FORGE_* variables. The custom JS is committed under
# extensions/ao3-companion/js/dist, so the server needs PHP only — no Node.

cd $FORGE_SITE_PATH

git pull origin $FORGE_SITE_BRANCH

$FORGE_COMPOSER install --no-dev --no-interaction --prefer-dist --optimize-autoloader

# Flarum steps are skipped until the site has been installed (config.php exists),
# so the very first deploy — before you run `flarum install` — won't error.
if [ -f config.php ]; then
    $FORGE_PHP flarum migrate
    $FORGE_PHP flarum assets:publish
    $FORGE_PHP flarum cache:clear
fi
