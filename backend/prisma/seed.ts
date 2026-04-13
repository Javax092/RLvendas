import bcrypt from "bcryptjs";
import { OrderStatus, PlanType, PrismaClient, ProductType } from "@prisma/client";

const prisma = new PrismaClient();

function decimal(value: number) {
  return value.toFixed(2);
}

async function main() {
  const passwordHash = await bcrypt.hash("123456", 10);

  await prisma.analyticsEvent.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.restaurantSetting.deleteMany();
  await prisma.user.deleteMany();
  await prisma.restaurant.deleteMany();

  const restaurant = await prisma.restaurant.create({
    data: {
      name: "RL Burguer",
      slug: "rl-burguer",
      description: "Hamburgueria premium com cardapio digital, combos estrategicos e pedido direto no WhatsApp.",
      logoUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&q=80",
      primaryColor: "#F97316",
      secondaryColor: "#111827",
      whatsappNumber: "5592999999999",
      plan: PlanType.PREMIUM,
      isAiUpsellOn: true,
      users: {
        create: {
          name: "Rafael Lima",
          email: "admin@rlburguer.app",
          passwordHash,
          role: "owner"
        }
      },
      settings: {
        create: {
          heroTitle: "O burger mais pedido da cidade, sem taxa de marketplace",
          heroSubtitle: "Escolha burgers, combos e adicionais. Finalize o pedido em segundos pelo WhatsApp.",
          bannerUrl: "https://images.unsplash.com/photo-1550317138-10000687a72b?auto=format&fit=crop&w=1600&q=80",
          deliveryFee: decimal(5),
          minimumOrderAmount: decimal(20),
          estimatedTimeMin: 25,
          estimatedTimeMax: 40,
          autoAcceptOrders: false,
          businessHours: "Seg-Dom 11:00 as 23:00",
          seoTitle: "RL Burguer | Cardapio Digital",
          seoDescription: "Peça smash burgers, combos, bebidas e adicionais da RL Burguer."
        }
      }
    },
    include: {
      settings: true
    }
  });

  const categories = await Promise.all(
    [
      {
        name: "Smash Burgers",
        slug: "smash-burgers",
        description: "Burgers artesanais com blend angus e montagem premium.",
        sortOrder: 1
      },
      {
        name: "Combos",
        slug: "combos",
        description: "Combos com burger, batata e bebida para aumentar o ticket medio.",
        sortOrder: 2
      },
      {
        name: "Acompanhamentos",
        slug: "acompanhamentos",
        description: "Batatas, onion rings e extras para complementar o pedido.",
        sortOrder: 3
      },
      {
        name: "Bebidas",
        slug: "bebidas",
        description: "Refrigerantes, sucos e bebidas especiais.",
        sortOrder: 4
      }
    ].map((category) =>
      prisma.category.create({
        data: {
          ...category,
          restaurantId: restaurant.id
        }
      })
    )
  );

  const categoryBySlug = new Map(categories.map((category) => [category.slug, category.id]));

  const products = await Promise.all(
    [
      {
        name: "RL Smash Classic",
        slug: "rl-smash-classic",
        description: "Pao brioche, smash 120g, cheddar derretido, picles e molho da casa.",
        imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1200&q=80",
        price: decimal(25),
        costPrice: decimal(9),
        compareAtPrice: decimal(29),
        stockQuantity: 42,
        isFeatured: true,
        productType: ProductType.SINGLE,
        tags: ["best-seller", "smash"],
        categorySlug: "smash-burgers"
      },
      {
        name: "Bacon Supreme",
        slug: "bacon-supreme",
        description: "Burger 150g, bacon crocante, queijo prato, cebola caramelizada e molho barbecue.",
        imageUrl: "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=1200&q=80",
        price: decimal(31),
        costPrice: decimal(12),
        compareAtPrice: decimal(35),
        stockQuantity: 28,
        isFeatured: true,
        productType: ProductType.SINGLE,
        tags: ["bacon", "premium"],
        categorySlug: "smash-burgers"
      },
      {
        name: "Cheddar Explosion",
        slug: "cheddar-explosion",
        description: "Dois smashes, cheddar cremoso, cebola crispy e molho especial.",
        imageUrl: "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=1200&q=80",
        price: decimal(33),
        costPrice: decimal(13),
        compareAtPrice: null,
        stockQuantity: 19,
        isFeatured: false,
        productType: ProductType.SINGLE,
        tags: ["cheddar", "duplo"],
        categorySlug: "smash-burgers"
      },
      {
        name: "Chicken Crunch",
        slug: "chicken-crunch",
        description: "Frango empanado, alface, tomate, queijo e maionese temperada.",
        imageUrl: "https://images.unsplash.com/photo-1606755962773-d324e0a13086?auto=format&fit=crop&w=1200&q=80",
        price: decimal(27),
        costPrice: decimal(10),
        compareAtPrice: null,
        stockQuantity: 24,
        isFeatured: false,
        productType: ProductType.SINGLE,
        tags: ["frango", "crispy"],
        categorySlug: "smash-burgers"
      },
      {
        name: "Combo RL Classic",
        slug: "combo-rl-classic",
        description: "RL Smash Classic, batata media e refrigerante 350ml.",
        imageUrl: "https://images.unsplash.com/photo-1550317138-10000687a72b?auto=format&fit=crop&w=1200&q=80",
        price: decimal(39),
        costPrice: decimal(16),
        compareAtPrice: decimal(44),
        stockQuantity: 16,
        isFeatured: true,
        productType: ProductType.COMBO,
        tags: ["combo", "ticket-medio"],
        categorySlug: "combos"
      },
      {
        name: "Combo Bacon Lovers",
        slug: "combo-bacon-lovers",
        description: "Bacon Supreme, fritas grandes e Coca-Cola zero 350ml.",
        imageUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1200&q=80",
        price: decimal(46),
        costPrice: decimal(18),
        compareAtPrice: null,
        stockQuantity: 11,
        isFeatured: true,
        productType: ProductType.COMBO,
        tags: ["combo", "bacon"],
        categorySlug: "combos"
      },
      {
        name: "Combo Duplo Cheddar",
        slug: "combo-duplo-cheddar",
        description: "Cheddar Explosion, onion rings e refri 350ml.",
        imageUrl: "https://images.unsplash.com/photo-1512152272829-e3139592d56f?auto=format&fit=crop&w=1200&q=80",
        price: decimal(48),
        costPrice: decimal(19),
        compareAtPrice: null,
        stockQuantity: 9,
        isFeatured: false,
        productType: ProductType.COMBO,
        tags: ["combo", "duplo"],
        categorySlug: "combos"
      },
      {
        name: "Batata Media",
        slug: "batata-media",
        description: "Batata frita crocante com sal de parrilla.",
        imageUrl: "https://images.unsplash.com/photo-1576107232684-1279f390859f?auto=format&fit=crop&w=1200&q=80",
        price: decimal(12),
        costPrice: decimal(4),
        compareAtPrice: null,
        stockQuantity: 14,
        isFeatured: false,
        productType: ProductType.ADDON,
        tags: ["addon", "fritas"],
        categorySlug: "acompanhamentos"
      },
      {
        name: "Batata Grande",
        slug: "batata-grande",
        description: "Porcao generosa de fritas crocantes para compartilhar.",
        imageUrl: "https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?auto=format&fit=crop&w=1200&q=80",
        price: decimal(17),
        costPrice: decimal(6),
        compareAtPrice: null,
        stockQuantity: 10,
        isFeatured: false,
        productType: ProductType.ADDON,
        tags: ["addon", "share"],
        categorySlug: "acompanhamentos"
      },
      {
        name: "Onion Rings",
        slug: "onion-rings",
        description: "Aneis de cebola empanados e sequinhos.",
        imageUrl: "https://images.unsplash.com/photo-1612392062798-f4cbf95339b9?auto=format&fit=crop&w=1200&q=80",
        price: decimal(16),
        costPrice: decimal(5),
        compareAtPrice: null,
        stockQuantity: 8,
        isFeatured: false,
        productType: ProductType.ADDON,
        tags: ["addon", "onion"],
        categorySlug: "acompanhamentos"
      },
      {
        name: "Bacon Extra",
        slug: "bacon-extra",
        description: "Porcao extra de bacon crocante para turbinar o burger.",
        imageUrl: "https://images.unsplash.com/photo-1528607929212-2636ec44253e?auto=format&fit=crop&w=1200&q=80",
        price: decimal(6),
        costPrice: decimal(2),
        compareAtPrice: null,
        stockQuantity: 15,
        isFeatured: false,
        productType: ProductType.ADDON,
        tags: ["addon", "bacon"],
        categorySlug: "acompanhamentos"
      },
      {
        name: "Coca-Cola 350ml",
        slug: "coca-cola-350ml",
        description: "Lata gelada para acompanhar o pedido.",
        imageUrl: "https://images.unsplash.com/photo-1629203432180-71e9b6411f6d?auto=format&fit=crop&w=1200&q=80",
        price: decimal(6),
        costPrice: decimal(2),
        compareAtPrice: null,
        stockQuantity: 35,
        isFeatured: false,
        productType: ProductType.SINGLE,
        tags: ["bebida", "refri"],
        categorySlug: "bebidas"
      },
      {
        name: "Guarana Zero 350ml",
        slug: "guarana-zero-350ml",
        description: "Guarana zero acucar, sempre gelado.",
        imageUrl: "https://images.unsplash.com/photo-1543253687-c931c8e01820?auto=format&fit=crop&w=1200&q=80",
        price: decimal(6),
        costPrice: decimal(2),
        compareAtPrice: null,
        stockQuantity: 35,
        isFeatured: false,
        productType: ProductType.SINGLE,
        tags: ["bebida", "zero"],
        categorySlug: "bebidas"
      },
      {
        name: "Limonada da Casa",
        slug: "limonada-da-casa",
        description: "Limonada refrescante feita na hora.",
        imageUrl: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=1200&q=80",
        price: decimal(9),
        costPrice: decimal(3),
        compareAtPrice: null,
        stockQuantity: 22,
        isFeatured: true,
        productType: ProductType.SINGLE,
        tags: ["bebida", "artesanal"],
        categorySlug: "bebidas"
      }
    ].map((product) =>
      prisma.product.create({
        data: {
          restaurantId: restaurant.id,
          categoryId: categoryBySlug.get(product.categorySlug)!,
          name: product.name,
          slug: product.slug,
          description: product.description,
          imageUrl: product.imageUrl,
          price: product.price,
          costPrice: product.costPrice,
          compareAtPrice: product.compareAtPrice,
          stockQuantity: product.stockQuantity,
          isFeatured: product.isFeatured,
          productType: product.productType,
          tags: product.tags
        }
      })
    )
  );

  const productBySlug = new Map(products.map((product) => [product.slug, product]));

  const seededOrders = [
    {
      customerName: "Marina Souza",
      customerPhone: "5592999911111",
      customerAddress: "Rua das Laranjeiras, 123",
      paymentMethod: "Pix",
      notes: "Sem cebola",
      status: OrderStatus.DELIVERED,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      items: [
        { slug: "rl-smash-classic", quantity: 2, unitPrice: 25 },
        { slug: "batata-media", quantity: 1, unitPrice: 12 }
      ]
    },
    {
      customerName: "Carlos Henrique",
      customerPhone: "5592999922222",
      customerAddress: "Av. Brasil, 900",
      paymentMethod: "Cartao",
      notes: "Trocar Coca por Guarana Zero",
      status: OrderStatus.READY,
      createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
      items: [
        { slug: "combo-bacon-lovers", quantity: 1, unitPrice: 46 },
        { slug: "bacon-extra", quantity: 1, unitPrice: 6 }
      ]
    },
    {
      customerName: "Ana Paula",
      customerPhone: "5592999933333",
      customerAddress: "Rua Rio Negro, 45",
      paymentMethod: "Dinheiro",
      notes: null,
      status: OrderStatus.PREPARING,
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      items: [
        { slug: "combo-rl-classic", quantity: 1, unitPrice: 39 },
        { slug: "onion-rings", quantity: 1, unitPrice: 16 }
      ]
    }
  ];

  for (const seededOrder of seededOrders) {
    const subtotal = seededOrder.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const deliveryFee = 5;
    const total = subtotal + deliveryFee;

    await prisma.order.create({
      data: {
        restaurantId: restaurant.id,
        customerName: seededOrder.customerName,
        customerPhone: seededOrder.customerPhone,
        customerAddress: seededOrder.customerAddress,
        paymentMethod: seededOrder.paymentMethod,
        notes: seededOrder.notes,
        subtotal: decimal(subtotal),
        deliveryFee: decimal(deliveryFee),
        total: decimal(total),
        status: seededOrder.status,
        whatsappMessage: "Pedido de demonstracao gerado pela seed.",
        whatsappUrl: `https://wa.me/${restaurant.whatsappNumber}`,
        createdAt: seededOrder.createdAt,
        items: {
          create: seededOrder.items.map((item) => ({
            productId: productBySlug.get(item.slug)!.id,
            quantity: item.quantity,
            unitPrice: decimal(item.unitPrice),
            totalPrice: decimal(item.quantity * item.unitPrice)
          }))
        }
      }
    });
  }

  await prisma.analyticsEvent.createMany({
    data: [
      { restaurantId: restaurant.id, type: "page_view", payload: { path: "/" } },
      { restaurantId: restaurant.id, type: "product_view", payload: { productSlug: "rl-smash-classic" } },
      { restaurantId: restaurant.id, type: "add_to_cart", payload: { productSlug: "combo-rl-classic" } },
      { restaurantId: restaurant.id, type: "checkout_started", payload: { channel: "web" } },
      { restaurantId: restaurant.id, type: "order_created", payload: { source: "seed" } }
    ]
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
