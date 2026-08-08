#!/bin/sh
# dumps all three databases into db/dumps.

set -e

DUMP_DIR=db/dumps
ENV_FILE=server/.env

if [ ! -f "$ENV_FILE" ]; then
    echo "$ENV_FILE not found. copy server/.env.example first."
    exit 1
fi

readSetting() {
    grep "^$1=" "$ENV_FILE" | cut -d= -f2
}

MYSQL_HOST=$(readSetting MYSQL_HOST)
MYSQL_USER=$(readSetting MYSQL_USER)
MYSQL_PASSWORD=$(readSetting MYSQL_PASSWORD)
MYSQL_DATABASE=$(readSetting MYSQL_DATABASE)
MONGO_DATABASE=$(readSetting MONGO_DATABASE)

mkdir -p "$DUMP_DIR"

echo "dumping MySQL..."
mysqldump -h "$MYSQL_HOST" -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" \
    --single-transaction --databases "$MYSQL_DATABASE" \
    > "$DUMP_DIR/job_offers_mysql.sql"

echo "dumping MongoDB..."
rm -rf "$DUMP_DIR/mongo"
mongodump --quiet --db "$MONGO_DATABASE" --out "$DUMP_DIR/mongo"
# the same data as json, because the bson dump is not readable
mongoexport --quiet --db "$MONGO_DATABASE" --collection offer_perks \
    --jsonArray --pretty --out "$DUMP_DIR/offer_perks.json"

echo "dumping Redis..."
redis-cli --rdb "$DUMP_DIR/job_offers_redis.rdb" > /dev/null 2>&1

# the rdb file restores but cannot be read, so write the keys out as text too.
# redis only holds what has been looked at recently, so run this after using
# the app or the cached keys will have expired
writeRedisKeys() {
    echo "redis keys held on $(date '+%Y-%m-%d %H:%M')"
    echo
    echo "the five patterns this app uses:"
    echo "  session:<token>              logged in user, 30 minute sliding expiry"
    echo "  loginAttempts:<email>        failed password counter, locks after 5"
    echo "  city:<id>                    cached city row"
    echo "  taxBrackets:<state>:<year>   cached tax brackets"
    echo "  comparison:<id>:scores       ranked scores, 1 hour"
    echo

    for KEY in $(redis-cli --scan | sort); do
        TYPE=$(redis-cli type "$KEY")
        TTL=$(redis-cli ttl "$KEY")

        echo "$KEY"
        echo "  type $TYPE, expires in $TTL seconds"

        # hashes and sorted sets come back as alternating lines, so pair them up
        if [ "$TYPE" = "hash" ]; then
            redis-cli hgetall "$KEY" | while read FIELD; do
                read VALUE
                echo "  $FIELD = $VALUE"
            done
        elif [ "$TYPE" = "zset" ]; then
            redis-cli zrange "$KEY" 0 -1 withscores | while read MEMBER; do
                read SCORE
                echo "  $MEMBER = $SCORE"
            done
        else
            redis-cli get "$KEY" | sed 's/^/  /'
        fi

        echo
    done
}

writeRedisKeys > "$DUMP_DIR/redis_keys.txt"

echo "done. files are in $DUMP_DIR"
ls -1 "$DUMP_DIR"
