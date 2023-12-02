'use client'

import Link from 'next/link'
import MaxWidthWrapper from './MaxWidthWrapper'
import { buttonVariants } from './ui/button'
import { LoginLink, RegisterLink } from '@kinde-oss/kinde-auth-nextjs'
import { ArrowRight } from 'lucide-react'

function Navbar() {
  return (
    <nav className='sticky h-14 inset-x-0 top-0 z-30 w-full border-b border-gray-200 bg-white/75 backdrop-blur-lg transition-all'>
      <MaxWidthWrapper>
        <div className='flex h-14 items-center justify-between border-b border-zinc-200'>
          <Link href='/' className='flex z-40 font-semibold'>
            <span>quill.</span>
          </Link>

          {/* Add mobile number */}

          <div className='hidden items-center space-x-4 sm:flex'>
            <>
              <Link
                className={buttonVariants({
                  size: 'sm',
                  variant: 'ghost',
                })}
                href={'/pricing'}
              >
                Pricing
              </Link>

              <LoginLink
                className={buttonVariants({
                  size: 'sm',
                  variant: 'ghost',
                })}
              >
                Sign In
              </LoginLink>

              <RegisterLink
                className={buttonVariants({
                  size: 'sm',
                })}
              >
                Get Started <ArrowRight className='ml-1.5 h-5 w-5' />
              </RegisterLink>
            </>
          </div>
        </div>
      </MaxWidthWrapper>
    </nav>
  )
}

export default Navbar