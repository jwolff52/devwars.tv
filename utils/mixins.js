// eslint-disable-next-line import/prefer-default-export
export const teams = {
    computed: {
        teams() {
            if (!this.game.teams) return null;

            return Object.values(this.game.teams).reduce((teams, team) => {
                const players = Object.values(this.game.players).reduce((players, player) => {
                    if (player.team === team.id) {
                        players[player.id] = player;
                    }
                    return players;
                }, {});

                let scores = {};
                let isWinner;
                if (this.game.meta && this.game.meta.teamScores) {
                    scores = {
                        total: Math.floor(Math.random() * 10),
                        objectives: this.game.meta.teamScores[team.id].objectives,
                    };

                    isWinner = this.game.meta.winningTeam === team.id;
                }

                teams[team.id] = {
                    ...team,
                    players,
                    numPlayers: Object.values(players).length,
                    scores,
                    isWinner,
                };

                return teams;
            }, {});
        },
    },
};

export const usersFromGame = {
    data: () => ({
        users: {},
    }),

    watch: {
        game() {
            this.getUsersFromGame();
        },
    },

    mounted() {
        this.getUsersFromGame();
    },
    methods: {
        playersWithUser(players) {
            const result = [];

            for (const player of Object.values(players)) {
                const user = this.users[player.id];
                if (user) result.push({ ...user, ...player });
            }

            return result;
        },

        async getUsersFromGame() {
            this.users = this.includePlayers ? this.game.players : this.users;
            if (Object.keys(this.users).length >= 1) return;

            const standardPlayers = Object.values(this.game.players).filter((e) => e.id !== 0);
            const competitorPlayers = Object.values(this.game.players).filter((e) => e.id === 0);

            const fetchUser = async (id) => {
                const res = await this.$axios.get(`/users/${id}`);
                return res.data;
            };

            const standardUsers = await Promise.all(standardPlayers.map((player) => fetchUser(player.id)));

            this.users = standardUsers.concat(competitorPlayers).reduce((acc, user) => {
                acc[user.id] = user;
                return acc;
            }, {});
        },
    },
};
