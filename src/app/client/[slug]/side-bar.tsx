"use client"

import { cn } from "@/lib/utils";
import { BookOpen, Bot, Car, ChevronRightSquare, LayoutDashboard, LucideBriefcase, MessageCircle, Receipt, Scan, ShoppingBag, Tag, Ticket, User, Users, Warehouse } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface Props {
  slug: string
  showRegistro?: boolean
  showCarServices?: boolean
}
export default function SideBar({ slug, showRegistro, showCarServices }: Props) {

  const data= [
    {
      href: `/client/${slug}`,
      icon: LayoutDashboard,
      text: "Dashboard"
    },
    {
      href: "divider", icon: User
    },
    {
      href: `/client/${slug}/documents`,
      icon: BookOpen,
      text: "Documentos"
    },
    {
      href: `/client/${slug}/chats`,
      icon: MessageCircle,
      text: "Conversaciones"
    },
    {
      href: `/client/${slug}/prompt`,
      icon: ChevronRightSquare,
      text: "Prompt"
    },
    {
      href: `/client/${slug}/simulator`,
      icon: Bot,
      text: "Simulador"
    },
    {
      href: "divider", icon: User
    },
    {
      href: `/client/${slug}/billing`,
      icon: Receipt,
      text: "Costos por uso"
    },
    {
      href: "divider", icon: User
    },  
    {
      href: `/client/${slug}/users`,
      icon: User,
      text: "Usuarios"
    },
  ]

  const path= usePathname()

  const commonClasses= "flex gap-2 items-center py-1 mx-2 rounded hover:bg-gray-200 dark:hover:text-black"
  const selectedClasses= "font-bold text-osom-color dark:border-r-white"

  const isChatPage= path.startsWith(`/client/${slug}/chats`)

  return (
    <div className={cn("flex flex-col justify-between border-r border-r-osom-color/50", !isChatPage && "lg:pl-8")}>
      <section className="flex flex-col gap-3 py-4 mt-3 ">
        {data.map(({ href, icon: Icon, text }, index) => {
          if (href === "divider") return divider(index)
          
          const selected= path.endsWith(href)
          const classes= cn(commonClasses, selected && selectedClasses)
          return (
            <Link href={href} key={href} className={classes}>
              <div className="pb-1">
                <Icon />
              </div>
              <p className={cn("hidden", !isChatPage && "md:block md:w-36")}>{text}</p>                  
            </Link>
          )
        })}
        <Link href={`/client/${slug}/registro`} className={cn(commonClasses, path.endsWith("registro") && selectedClasses, !showRegistro && "hidden")}>
          <div className="pb-1">
            <Warehouse size={23} />
          </div>
          <p className={cn("hidden", !isChatPage && "md:block md:w-36")}>Registro</p>                  
        </Link>

        <Link href="/client/summit/summit" className={cn(commonClasses, path.endsWith("summit/summit") && selectedClasses, slug !== "summit" && "hidden")}>
          <div>
            <Ticket size={23} />
          </div>
          <p className={cn("hidden", !isChatPage && "md:block md:w-36")}>Reservas</p>                  
        </Link>

        <Link href={`/client/${slug}/car-service`} className={cn(commonClasses, path.endsWith("car-service") && selectedClasses, !showCarServices && "hidden")}>
          <div className="pb-1">
          <Car size={23} />
          </div>
          <p className={cn("hidden", !isChatPage && "md:block md:w-36")}>Servicios</p>                  
        </Link>

        {divider()}

        <Link href={`/client/${slug}/clientes`} className={cn(commonClasses, path.endsWith("clientes") && selectedClasses)}>
          <div className="pb-1">
            <LucideBriefcase size={23} /> 
          </div>
          <p className={cn("hidden", !isChatPage && "md:block md:w-36")}>Clientes</p>
        </Link>

        <Link href={`/client/${slug}/productos`} className={cn(commonClasses, path.endsWith("productos") && selectedClasses)}>
          <div className="pb-1">
            <Scan size={23} /> 
          </div>
          <p className={cn("hidden", !isChatPage && "md:block md:w-36")}>Productos</p>                  
        </Link>

        <Link href={`/client/${slug}/categorias`} className={cn(commonClasses, path.endsWith("categorias") && selectedClasses)}>
          <div className="pb-1">
            <Tag size={23} /> 
          </div>
          <p className={cn("hidden", !isChatPage && "md:block md:w-36")}>Categorias</p>
        </Link>

        <Link href={`/client/${slug}/ventas`} className={cn(commonClasses, path.endsWith("ventas") && selectedClasses)}>
          <div className="pb-1">
            <ShoppingBag size={23} />  
          </div>
          <p className={cn("hidden", !isChatPage && "md:block md:w-36")}>Ventas</p>
        </Link>

        <Link href={`/client/${slug}/vendedores`} className={cn(commonClasses, path.endsWith("vendedores") && selectedClasses)}>
          <div className="pb-1">
          <Users size={23} />  
          </div>
          <p className={cn("hidden", !isChatPage && "md:block md:w-36")}>Vendedores</p>
        </Link>

      </section>
    </div>
  );
}


function divider(key?: number) {
  return <div key={key} className="mx-2 my-5 border-b border-b-osom-color/50" />
}
