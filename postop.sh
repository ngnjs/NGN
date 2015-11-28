curl -H "Content-Type: application/json" \
    -X POST \
    -d '{"version":"${TRAVIS_TAG}"}' \
    ${POSTOP_URL}
