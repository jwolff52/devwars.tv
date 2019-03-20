import Http from '../services/Http';

export const state = () => ({
    user: null,
    competitor: null,
    count: 0,
    linkedAccounts: [],
});

export const getters = {
    userCount(state) {
        return state.count;
    },
};

export const mutations = {
    user(state, user) {
        state.user = user;
    },

    competitor(state, competitor) {
        state.competitor = competitor;
    },

    count(state, count) {
        state.count = count;
    },

    linkedAccounts(state, accounts) {
        state.linkedAccounts = accounts;
    },

    removeLinkedAccount(state, provider) {
        state.linkedAccounts = state.linkedAccounts.filter(
            (it) => it.provider !== provider
        );
    },
};

export const actions = {
    async refresh({ commit, dispatch }) {
        try {
            const user = await Http.for('auth/user').get();

            commit('user', user);

            await dispatch('competitor');
            await dispatch('linkedAccounts');
        } catch (e) {
            commit('user', null);
        }
    },

    async competitor({ commit, state }) {
        try {
            const competitor = await Http.for(
                `/user/${state.user.id}/competitor`
            ).get();

            commit('competitor', competitor);
        } catch (e) {
            commit('user', null);
        }
    },

    async refreshUserCount({ commit }) {
        const data = await Http.for('leaderboard').get('users');

        commit('count', data.count);
    },

    async login({ commit, dispatch }, { username, password }) {
        try {
            await Http.for('auth').post('login', {
                identifier: username,
                password,
            });

            await dispatch('refresh');

            dispatch(
                'toast/add',
                { type: 'success', message: 'Welcome back to DevWars!' },
                { root: true }
            );

            await dispatch('nuxtServerInit', null, { root: true });

            dispatch('navigate', '/dashboard', { root: true });
        } catch (e) {
            dispatch('toast/error', e.response.data, { root: true });

            commit('user', null);
        }
    },

    async register({dispatch }, registration) {
        try {
            await Http.for('auth').post('register', registration);

            await dispatch('refresh');

            dispatch('navigate', '/dashboard', { root: true });
        } catch (e) {
            dispatch('toast/errors', e, { root: true });
        }
    },

    async logout({ commit, dispatch }) {
        await Http.for('auth').post('logout');

        await dispatch('navigate', '/', { root: true });

        commit('user', null);
    },

    async settings({ commit, dispatch, state }, data) {
        try {
            const user = await Http.for(`user/${state.user.id}/settings`).post(
                data
            );

            commit('user', user);
        } catch (e) {
            dispatch('toast/errors', e, { root: true });
        }
    },

    async password({dispatch, state }, data) {
        try {
            await Http.for(`user/${state.user.id}/reset/password`).put(data);

            dispatch('toast/success', `We've updated your password!`, {
                root: true,
            });
        } catch (e) {
            dispatch('toast/errors', e, { root: true });
        }
    },

    async email({ dispatch, commit, state }, data) {
        try {
            const user = await Http.for(`user/${state.user.id}/reset`).post(
                'email',
                data
            );

            commit('user', user);

            await dispatch(
                'toast/success',
                `We've updated your email, please go verify your email.`,
                { root: true }
            );
            await dispatch('navigate', '/pending', { root: true });
        } catch (e) {
            console.error(e);
            dispatch('toast/errors', e, { root: true });
        }
    },

    async forgot({ dispatch }, email) {
        try {
            await Http.for('auth/reset').save({ username_or_email: email });

            dispatch(
                'toast/success',
                `Check your email for a guide to reset your password.`,
                { root: true }
            );

            return true;
        } catch (e) {
            dispatch('toast/errors', e, { root: true });

            return false;
        }
    },

    async resetByKey({ dispatch }, data) {
        await Http.for('auth/reset').put({}, data);

        dispatch(
            'toast/success',
            `We've updated your password, give it a go!`,
            { root: true }
        );
    },

    async avatar({ dispatch, state }, data) {
        const formData = new FormData();
        formData.append('avatar', data, 'avatar.jpg');

        await Http.axios({
            url: `/user/${state.user.id}/avatar`,
            method: 'POST',
            data: formData,
            noTransform: true,
        });

        await dispatch('refresh');
    },

    async linkedAccounts({ commit, state }) {
        const accounts = await Http.for(`user/${state.user.id}`).get(
            'linked-accounts'
        );

        commit('linkedAccounts', accounts);
        return accounts;
    },

    async disconnectLinkedAccount({ dispatch, commit, state }, provider) {
        await Http.for(
            `user/${state.user.id}/linked-accounts/${provider}`
        ).delete();

        commit('removeLinkedAccount', provider);

        await dispatch('refresh');
    },
};
