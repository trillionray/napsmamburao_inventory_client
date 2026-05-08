const deliveryMenu = menu.map(item => ({
	...item,
	price: Math.round(item.price * 1.10)
}));

export default deliveryMenu;